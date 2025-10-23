import { NextResponse } from 'next/server';
import authService from '../../../../src/services/authService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { otp, pendingSignupData } = await request.json();

    console.log('🔍 Verify email request:', { otp: otp ? 'provided' : 'missing', email: pendingSignupData?.email });

    if (!otp || !pendingSignupData) {
      console.error('❌ Missing required data:', { otp: !!otp, pendingSignupData: !!pendingSignupData });
      return NextResponse.json(
        { error: 'OTP and pending signup data are required' },
        { status: 400 }
      );
    }

    const result = await authService.verifyEmailOTP(otp, pendingSignupData);
    
    console.log('✅ Email verification successful');
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Verify email OTP API error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || 'Email verification failed' },
      { status: 500 }
    );
  }
}
