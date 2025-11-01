import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Order } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const orderData = await request.json();
    
    // Create pending order with Robokassa order ID
    const order = new Order({
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'robokassa'
    });
    
    await order.save();
    
    console.log('✅ Pending order saved to MongoDB:', order.orderId);
    
    return NextResponse.json({ 
      success: true, 
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus
      },
      message: 'Pending order created successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error creating pending order:', error);
    return NextResponse.json(
      { error: 'Failed to create pending order', details: error.message },
      { status: 500 }
    );
  }
}

