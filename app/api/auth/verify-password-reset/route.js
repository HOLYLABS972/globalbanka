import { NextResponse } from 'next/server';
import authService from '../../../../src/services/authService';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    const result = await authService.verifyPasswordResetOTP(email, otp, newPassword);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify password reset OTP API error:', error);
    return NextResponse.json(
      { error: error.message || 'Password reset verification failed' },
      { status: 500 }
    );
  }
}
