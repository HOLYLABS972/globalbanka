import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Load Robokassa config from MongoDB
    await connectDB();
    const config = await AdminConfig.findOne();
    
    const robokassaMerchantLogin = config?.robokassaMerchantLogin || process.env.ROBOKASSA_MERCHANT_LOGIN || process.env.NEXT_PUBLIC_ROBOKASSA_MERCHANT_LOGIN || '';
    const robokassaPassOne = config?.robokassaPassOne || process.env.ROBOKASSA_PASS_ONE || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_ONE || '';
    const robokassaMode = config?.robokassaMode || process.env.ROBOKASSA_MODE || 'test';
    const robokassaBaseUrl = process.env.ROBOKASSA_BASE_URL || 'https://auth.robokassa.ru/Merchant/Index.aspx';
    
    if (!robokassaMerchantLogin || !robokassaPassOne) {
      return NextResponse.json(
        { error: 'Robokassa credentials not configured' },
        { status: 503 }
      );
    }
    
    const data = await request.json();
    const { order, email, name, total, currency, domain, description } = data;
    
    if (!order || !total || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields: order, total, domain' },
        { status: 400 }
      );
    }
    
    // Validate order ID - must be numeric
    let orderIdInt;
    try {
      orderIdInt = parseInt(order, 10);
      if (isNaN(orderIdInt) || orderIdInt < 1) {
        return NextResponse.json(
          { error: 'Order ID must be a positive number' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }
    
    const amount = parseFloat(total);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    // Generate signature
    // Robokassa signature format: MerchantLogin:OutSum:InvId:Password1
    const signatureString = `${robokassaMerchantLogin}:${amount}:${orderIdInt}:${robokassaPassOne}`;
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');
    
    console.log('🔐 Generated Robokassa signature:', signatureString.substring(0, 50) + '...');
    
    // Build payment URL
    const params = new URLSearchParams({
      MerchantLogin: robokassaMerchantLogin,
      OutSum: amount.toString(),
      InvId: orderIdInt.toString(),
      Description: description || name || 'eSIM Package',
      SignatureValue: signature,
      Culture: 'ru',
      Encoding: 'utf-8'
    });
    
    // Add test mode if configured
    if (robokassaMode === 'test') {
      params.append('IsTest', '1');
    }
    
    // Add email if provided
    if (email) {
      params.append('Email', email);
    }
    
    // Add success and fail URLs
    params.append('SuccessURL', `${domain}/api/robokassa/callback`);
    params.append('FailURL', `${domain}/payment-failed?reason=payment_cancelled`);
    
    const paymentUrl = `${robokassaBaseUrl}?${params.toString()}`;
    
    console.log('✅ Robokassa payment URL generated');
    
    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId: orderIdInt
    });
    
  } catch (error) {
    console.error('❌ Error creating Robokassa payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}

