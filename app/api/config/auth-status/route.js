import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get admin config
    let config = await AdminConfig.findOne();
    
    // Return only auth enabled flags
    return NextResponse.json({
      success: true,
      googleAuthEnabled: config?.googleAuthEnabled ?? false,
      yandexAuthEnabled: config?.yandexAuthEnabled ?? false
    });
    
  } catch (error) {
    console.error('❌ Error fetching auth status:', error);
    // Return defaults on error
    return NextResponse.json({
      success: true,
      googleAuthEnabled: false,
      yandexAuthEnabled: false
    });
  }
}

