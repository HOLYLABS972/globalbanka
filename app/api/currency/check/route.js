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
    
    // Return currency rates
    return NextResponse.json({
      success: true,
      rates: {
        usdToRub: config.usdToRubRate || 100
      },
      config: {
        discountPercentage: config.discountPercentage || 0,
        robokassaMode: config.robokassaMode || 'test',
        roamjetMode: config.roamjetMode || 'sandbox'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching currency config:', error);
    return NextResponse.json(
      { 
        success: true, 
        rates: { usdToRub: 100 },
        config: {
          discountPercentage: 0,
          robokassaMode: 'test',
          roamjetMode: 'sandbox'
        }
      }
    );
  }
}

