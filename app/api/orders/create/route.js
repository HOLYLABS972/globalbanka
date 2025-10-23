import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Order } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const orderData = await request.json();
    
    // Create new order
    const order = new Order(orderData);
    await order.save();
    
    console.log('✅ Order saved to MongoDB:', order._id);
    
    return NextResponse.json({ 
      success: true, 
      orderId: order._id,
      message: 'Order created successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
