import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const { oldPassword, newPassword } = await request.json();
    
    // Get or create admin config
    let config = await AdminConfig.findOne();
    if (!config) {
      config = new AdminConfig({ adminPassword: '123456' });
      await config.save();
    }
    
    // Verify old password
    if (oldPassword !== config.adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Update password
    config.adminPassword = newPassword;
    config.lastUpdated = new Date();
    await config.save();
    
    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    return NextResponse.json(
      { error: 'Failed to update password', details: error.message },
      { status: 500 }
    );
  }
}

