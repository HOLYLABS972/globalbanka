import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Order } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const orderData = await request.json();
    const { orderId, ...updateFields } = orderData;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    console.log('📦 Updating order:', orderId, 'with data:', JSON.stringify(updateFields, null, 2));
    
    // Find and update the existing order
    const order = await Order.findOneAndUpdate(
      { orderId: orderId.toString() },
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Order updated in MongoDB:', order._id);
    
    return NextResponse.json({ 
      success: true, 
      orderId: order._id,
      message: 'Order updated successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error updating order:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to update order', 
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

