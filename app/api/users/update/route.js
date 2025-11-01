import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { User } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, ...updateData } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Allowed fields to update
    const allowedFields = ['displayName', 'role', 'emailVerified', 'isActive', 'phone'];
    
    // Build update object
    const update = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        update[field] = updateData[field];
      }
    });
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true }
    ).select('-password').lean();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

