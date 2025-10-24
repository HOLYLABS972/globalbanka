import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Force dynamic rendering for this API route (handles callbacks with dynamic parameters)
export const dynamic = 'force-dynamic';

// Robokassa configuration
const ROBOKASSA_CONFIG = {
  merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || 'your_merchant_login',
  passOne: process.env.ROBOKASSA_PASS_ONE || 'your_pass_one',
  passTwo: process.env.ROBOKASSA_PASS_TWO || 'your_pass_two',
  mode: process.env.ROBOKASSA_MODE || 'test'
};

/**
 * Generate MD5 hash for Robokassa signature verification
 */
function generateSignature(params, password) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join(':');
  
  const signatureString = `${sortedParams}:${password}`;
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Verify Robokassa callback signature
 */
function verifyCallbackSignature(params) {
  const { OutSum, InvId, SignatureValue } = params;
  
  const verificationParams = {
    OutSum,
    InvId,
    PassTwo: ROBOKASSA_CONFIG.passTwo
  };

  const expectedSignature = generateSignature(verificationParams, ROBOKASSA_CONFIG.passTwo);
  return expectedSignature.toLowerCase() === SignatureValue.toLowerCase();
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🔍 Robokassa callback received:', body);

    // Verify the signature
    const isValid = verifyCallbackSignature(body);
    
    if (!isValid) {
      console.error('❌ Invalid Robokassa callback signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const { OutSum, InvId, SignatureValue } = body;
    
    // Convert amount from kopecks to rubles
    const amount = OutSum / 100;
    
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

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      orderId: InvId,
      amount: amount
    });

  } catch (error) {
    console.error('❌ Error processing Robokassa callback:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    console.log('🔍 Robokassa success callback received:', params);

    // Verify the signature for success callback
    const isValid = verifyCallbackSignature(params);
    
    if (!isValid) {
      console.error('❌ Invalid Robokassa success callback signature');
      return NextResponse.redirect(new URL('/payment-failed?reason=invalid_signature', request.url));
    }

    const { OutSum, InvId } = params;
    const amount = OutSum / 100;
    
    console.log('✅ Robokassa payment success verified:', {
      orderId: InvId,
      amount: amount
    });

    // Redirect to success page with order information
    const successUrl = new URL('/payment-success', request.url);
    successUrl.searchParams.set('order', InvId);
    successUrl.searchParams.set('amount', amount.toString());
    successUrl.searchParams.set('payment_method', 'robokassa');

    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('❌ Error processing Robokassa success callback:', error);
    return NextResponse.redirect(new URL('/payment-failed?reason=processing_error', request.url));
  }
}
