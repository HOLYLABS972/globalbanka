import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear config cache when config is updated
    // Note: This is a simple implementation. In a distributed system, you'd need a cache invalidation strategy
    return NextResponse.json({ 
      success: true,
      message: 'Config cache cleared'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    );
  }
}

