import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get admin config
    let config = await AdminConfig.findOne();
    
    // Return auth status and credentials
    return NextResponse.json({
      success: true,
      googleId: config?.googleId || '',
      googleSecret: config?.googleSecret || '',
      googleAuthEnabled: config?.googleAuthEnabled ?? false,
      yandexAppId: config?.yandexAppId || '',
      yandexAppSecret: config?.yandexAppSecret || '',
      yandexAuthEnabled: config?.yandexAuthEnabled ?? false
    });
    
  } catch (error) {
    console.error('❌ Error fetching auth status:', error);
    // Return defaults on error
    return NextResponse.json({
      success: true,
      googleId: '',
      googleSecret: '',
      googleAuthEnabled: false,
      yandexAppId: '',
      yandexAppSecret: '',
      yandexAuthEnabled: false
    });
  }
}

