import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { User, Order, Esim } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Delete related orders
    await Order.deleteMany({ userId: userId });
    
    // Delete related eSIMs
    await Esim.deleteMany({ userId: userId });
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User and all related data deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}

