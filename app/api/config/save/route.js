import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const updateData = await request.json();
    
    // Get or create admin config
    let config = await AdminConfig.findOne();
    if (!config) {
      config = new AdminConfig({ adminPassword: '123456' });
    }
    
    // Update fields (exclude adminPassword from updates here - use separate endpoint)
    const allowedFields = [
      'googleId',
      'yandexAppId',
      'yandexAppSecret',
      'roamjetApiKey',
      'robokassaMerchantLogin',
      'robokassaPassOne',
      'robokassaPassTwo',
      'robokassaMode'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        config[field] = updateData[field];
      }
    });
    
    config.lastUpdated = new Date();
    await config.save();
    
    const configData = config.toObject();
    delete configData.adminPassword;
    
    return NextResponse.json({ 
      success: true,
      config: configData,
      message: 'Configuration saved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error saving admin config:', error);
    return NextResponse.json(
      { error: 'Failed to save config', details: error.message },
      { status: 500 }
    );
  }
}

