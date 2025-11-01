import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Order } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const orderData = await request.json();
    
    console.log('📦 Creating order with data:', JSON.stringify(orderData, null, 2));
    
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
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to create order', 
        details: error.message,
        errorName: error.name,
        validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : null
      },
      { status: 500 }
    );
  }
}
