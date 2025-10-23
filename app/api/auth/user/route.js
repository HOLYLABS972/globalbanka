import { NextResponse } from 'next/server';
import authService from '../../../../src/services/authService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await authService.getUserById(userId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}
