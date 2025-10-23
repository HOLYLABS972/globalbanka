import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { ApiUsage } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const usageData = await request.json();
    
    // Create new API usage record
    const apiUsage = new ApiUsage(usageData);
    await apiUsage.save();
    
    console.log('✅ API usage saved to MongoDB:', apiUsage._id);
    
    return NextResponse.json({ 
      success: true, 
      usageId: apiUsage._id,
      message: 'API usage logged successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error logging API usage:', error);
    return NextResponse.json(
      { error: 'Failed to log API usage', details: error.message },
      { status: 500 }
    );
  }
}
