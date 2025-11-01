import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { User } from '../../../../src/database/models';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get stats
    const [totalUsers, activeUsers, customers, admins, businesses] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'business' })
    ]);
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        customers,
        admins,
        businesses
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}

