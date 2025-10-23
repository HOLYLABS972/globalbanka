import { NextResponse } from 'next/server';
import authService from '../../../../src/services/authService';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await authService.resetPassword(email);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: error.message || 'Password reset failed' },
      { status: 500 }
    );
  }
}
