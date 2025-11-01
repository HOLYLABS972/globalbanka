import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get admin config
    let config = await AdminConfig.findOne();
    if (!config) {
      config = new AdminConfig({ adminPassword: '123456' });
      await config.save();
    }
    
    // Return config with defaults filled in
    const configData = {
      googleId: config.googleId || '',
      googleSecret: config.googleSecret || '',
      googleAuthEnabled: config.googleAuthEnabled ?? false,
      yandexAppId: config.yandexAppId || '',
      yandexAppSecret: config.yandexAppSecret || '',
      yandexAuthEnabled: config.yandexAuthEnabled ?? false,
      roamjetApiKey: config.roamjetApiKey || '',
      roamjetMode: config.roamjetMode || 'sandbox',
      robokassaMerchantLogin: config.robokassaMerchantLogin || '',
      robokassaPassOne: config.robokassaPassOne || '',
      robokassaPassTwo: config.robokassaPassTwo || '',
      robokassaMode: config.robokassaMode || 'test',
      discountPercentage: config.discountPercentage || 0,
      usdToRubRate: config.usdToRubRate || 100
    };
    
    return NextResponse.json({ 
      success: true,
      config: configData
    });
    
  } catch (error) {
    console.error('❌ Error fetching admin config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config', details: error.message },
      { status: 500 }
    );
  }
}

