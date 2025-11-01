import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Order } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete the order
    const order = await Order.findOneAndDelete({ orderId });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    );
  }
}

