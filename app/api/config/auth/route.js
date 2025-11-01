import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';

export async function POST(request) {
  try {
    await connectDB();
    
    const { password } = await request.json();
    
    // Get or create admin config
    let config = await AdminConfig.findOne();
    if (!config) {
      config = new AdminConfig({ adminPassword: '123456' });
      await config.save();
    }
    
    // Check password
    if (password === config.adminPassword) {
      // Return success without exposing the password
      return NextResponse.json({ 
        success: true,
        authenticated: true
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error authenticating admin config:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}

