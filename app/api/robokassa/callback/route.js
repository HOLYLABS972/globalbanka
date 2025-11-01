import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '../../../../src/database/config';
import { Order, AdminConfig } from '../../../../src/database/models';

// Force dynamic rendering for this API route (handles callbacks with dynamic parameters)
export const dynamic = 'force-dynamic';

// Load Robokassa config from MongoDB or fallback to env
async function getRobokassaConfig() {
  await connectDB();
  const config = await AdminConfig.findOne();
  
  return {
    merchantLogin: config?.robokassaMerchantLogin || process.env.ROBOKASSA_MERCHANT_LOGIN || process.env.NEXT_PUBLIC_ROBOKASSA_MERCHANT_LOGIN || '',
    passOne: config?.robokassaPassOne || process.env.ROBOKASSA_PASS_ONE || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_ONE || '',
    passTwo: config?.robokassaPassTwo || process.env.ROBOKASSA_PASS_TWO || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_TWO || '',
    mode: config?.robokassaMode || process.env.ROBOKASSA_MODE || 'test'
};
}

/**
 * Generate MD5 hash for Robokassa signature verification
 * Robokassa signature format: OutSum:InvId:Password2 (for ResultURL)
 * or MerchantLogin:OutSum:InvId:Password1 (for SuccessURL)
 */
function generateSignature(...args) {
  // Join all arguments with colons
  const signatureString = args.join(':');
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Verify Robokassa callback signature
 * For ResultURL: uses Password2, signature format: OutSum:InvId:Password2
 * For SuccessURL: uses Password1, signature format: MerchantLogin:OutSum:InvId:Password1
 */
async function verifyCallbackSignature(params, usePassOne = false) {
  const { OutSum, InvId, SignatureValue } = params;
  const ROBOKASSA_CONFIG = await getRobokassaConfig();
  
  // Use Password1 for SuccessURL, Password2 for ResultURL
  const password = usePassOne ? ROBOKASSA_CONFIG.passOne : ROBOKASSA_CONFIG.passTwo;
  
  let expectedSignature;
  let expectedSignatureWithoutMerchantLogin;
  
  if (usePassOne) {
    // SuccessURL: Try both formats - with and without MerchantLogin
    // Format 1: MerchantLogin:OutSum:InvId:Password1
    expectedSignature = generateSignature(
      ROBOKASSA_CONFIG.merchantLogin,
      OutSum,
      InvId,
      password
    );
    // Format 2: OutSum:InvId:Password1 (fallback)
    expectedSignatureWithoutMerchantLogin = generateSignature(OutSum, InvId, password);
  } else {
    // ResultURL: OutSum:InvId:Password2
    expectedSignature = generateSignature(OutSum, InvId, password);
  }
  
  console.log('🔐 Signature verification:', {
    merchantLogin: usePassOne ? ROBOKASSA_CONFIG.merchantLogin : 'N/A',
    outSum: OutSum,
    invId: InvId,
    passwordType: usePassOne ? 'PassOne' : 'PassTwo',
    signatureFormat: usePassOne ? 'MerchantLogin:OutSum:InvId:PassOne' : 'OutSum:InvId:PassTwo',
    expectedSignature,
    expectedSignatureWithoutMerchantLogin: usePassOne ? expectedSignatureWithoutMerchantLogin : 'N/A',
    receivedSignature: SignatureValue,
    match: expectedSignature.toLowerCase() === SignatureValue.toLowerCase(),
    matchWithoutMerchantLogin: usePassOne ? expectedSignatureWithoutMerchantLogin.toLowerCase() === SignatureValue.toLowerCase() : false
  });
  
  // Try primary signature first, fallback to alternate format for SuccessURL
  if (usePassOne && expectedSignatureWithoutMerchantLogin) {
    return expectedSignature.toLowerCase() === SignatureValue.toLowerCase() || 
           expectedSignatureWithoutMerchantLogin.toLowerCase() === SignatureValue.toLowerCase();
  }
  
  return expectedSignature.toLowerCase() === SignatureValue.toLowerCase();
}

export async function POST(request) {
  try {
    // Robokassa ResultURL sends form data, not JSON
    // Try to get form data first, fallback to JSON
    let body;
    try {
      body = await request.formData();
      body = Object.fromEntries(body.entries());
    } catch {
      body = await request.json();
    }
    
    console.log('🔍 Robokassa ResultURL callback received:', body);

    // Verify the signature using Password2 for ResultURL
    const isValid = await verifyCallbackSignature(body, false);
    
    if (!isValid) {
      console.error('❌ Invalid Robokassa callback signature');
      // Robokassa expects plain text "bad sign" for invalid signature
      return new NextResponse('bad sign', { status: 400 });
    }

    const { OutSum, InvId, SignatureValue } = body;
    
    // Convert amount from kopecks to rubles (if needed)
    // Note: OutSum might already be in rubles or kopecks depending on Robokassa config
    const amount = OutSum;
    
    console.log('✅ Robokassa payment verified:', {
      orderId: InvId,
      amount: amount,
      signature: SignatureValue
    });

    // Here you would typically:
    // 1. Update your database with the payment confirmation
    // 2. Send confirmation email to customer
    // 3. Process the eSIM order
    // 4. Update order status

    // For now, we'll just log the successful payment
    console.log('💰 Payment processed successfully for order:', InvId);

    // Robokassa ResultURL expects plain text response: "OK{InvId}"
    return new NextResponse(`OK${InvId}`, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('❌ Error processing Robokassa callback:', error);
    // Robokassa expects plain text "error" for errors
    return new NextResponse('error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const ROBOKASSA_CONFIG = await getRobokassaConfig();
    
    console.log('🔍 Robokassa success callback received:', params);
    console.log('🔍 Full URL:', request.url);
    console.log('🔍 Environment:', {
      merchantLogin: ROBOKASSA_CONFIG.merchantLogin,
      passOne: ROBOKASSA_CONFIG.passOne?.substring(0, 5) + '...',
      passTwo: ROBOKASSA_CONFIG.passTwo?.substring(0, 5) + '...'
    });

    // Verify the signature for success callback using Password1
    const isValid = await verifyCallbackSignature(params, true);
    
    if (!isValid) {
      console.error('❌ Invalid Robokassa success callback signature');
      console.error('❌ Received params:', JSON.stringify(params, null, 2));
      return NextResponse.redirect(new URL('/payment-failed?reason=invalid_signature', request.url));
    }

    const { OutSum, InvId } = params;
    const amount = OutSum; // OutSum is already in rubles (not kopecks)
    
    console.log('✅ Robokassa payment success verified:', {
      orderId: InvId,
      amount: amount
    });

    // Fetch pending order from MongoDB
    let orderDetails = null;
    try {
      await connectDB();
      const order = await Order.findOne({ orderId: InvId.toString() });
      
      if (order) {
        orderDetails = {
          packageId: order.packageId,
          customerEmail: order.customerEmail,
          planName: order.description || order.packageId,
          userId: order.userId
        };
        console.log('✅ Found pending order in MongoDB:', orderDetails);
        
        // Update order status to paid
        order.paymentStatus = 'paid';
        order.status = 'processing';
        await order.save();
        console.log('✅ Order marked as paid and processing');
      } else {
        console.error('⚠️ No pending order found for orderId:', InvId);
      }
    } catch (dbError) {
      console.error('⚠️ Error fetching order from MongoDB:', dbError);
      // Continue anyway - will try to get from localStorage on client
    }

    // Redirect to success page with order information
    const successUrl = new URL('/payment-success', request.url);
    successUrl.searchParams.set('order', InvId);
    successUrl.searchParams.set('amount', amount.toString());
    successUrl.searchParams.set('payment_method', 'robokassa');
    
    // Add order details if available
    if (orderDetails) {
      successUrl.searchParams.set('plan_id', orderDetails.packageId);
      successUrl.searchParams.set('email', orderDetails.customerEmail);
      if (orderDetails.planName) {
        successUrl.searchParams.set('name', orderDetails.planName);
      }
    }

    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('❌ Error processing Robokassa success callback:', error);
    return NextResponse.redirect(new URL('/payment-failed?reason=processing_error', request.url));
  }
}
