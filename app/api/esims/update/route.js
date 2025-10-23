import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Esim } from '../../../../src/database/models';

export async function PUT(request) {
  try {
    await connectDB();
    
    const updateData = await request.json();
    const { orderId, userId, ...updates } = updateData;
    
    // Find and update eSIM record by orderId and userId
    const esim = await Esim.findOneAndUpdate(
      { 
        'orderResult.orderId': orderId,
        userId: userId 
      },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { 
        new: true,
        upsert: false
      }
    );
    
    if (!esim) {
      return NextResponse.json(
        { error: 'eSIM record not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ eSIM record updated in MongoDB:', esim._id);
    
    return NextResponse.json({ 
      success: true, 
      esimId: esim._id,
      message: 'eSIM record updated successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error updating eSIM record:', error);
    return NextResponse.json(
      { error: 'Failed to update eSIM record', details: error.message },
      { status: 500 }
    );
  }
}
