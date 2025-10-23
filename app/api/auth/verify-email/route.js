import { NextResponse } from 'next/server';
import authService from '../../../../src/services/authService';

export async function POST(request) {
  try {
    const { otp, pendingSignupData } = await request.json();

    if (!otp || !pendingSignupData) {
      return NextResponse.json(
        { error: 'OTP and pending signup data are required' },
        { status: 400 }
      );
    }

    const result = await authService.verifyEmailOTP(otp, pendingSignupData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify email OTP API error:', error);
    return NextResponse.json(
      { error: error.message || 'Email verification failed' },
      { status: 500 }
    );
  }
}
