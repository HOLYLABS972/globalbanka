import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Esim } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const esimData = await request.json();
    
    // Create new eSIM record
    const esim = new Esim(esimData);
    await esim.save();
    
    console.log('✅ eSIM record saved to MongoDB:', esim._id);
    
    return NextResponse.json({ 
      success: true, 
      esimId: esim._id,
      message: 'eSIM record created successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error creating eSIM record:', error);
    return NextResponse.json(
      { error: 'Failed to create eSIM record', details: error.message },
      { status: 500 }
    );
  }
}
