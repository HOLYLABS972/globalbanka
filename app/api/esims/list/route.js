import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { Esim } from '../../../../src/database/models';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }
    
    // Find all eSIMs for the user (check both formats: real userId and email fallback)
    const emailFallback = userId.startsWith('email_') ? userId : `email_${userId.replace('email_', '')}`;
    const esims = await Esim.find({ 
      $or: [
        { userId: userId },
        { userId: emailFallback }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${esims.length} eSIMs for user:`, userId);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        orders: esims.map(esim => ({
          id: esim._id,
          orderId: esim.orderResult?.orderId || esim._id,
          planName: esim.planName,
          amount: esim.price,
          status: esim.status,
          customerEmail: esim.customerEmail,
          createdAt: esim.createdAt,
          updatedAt: esim.updatedAt,
          countryCode: esim.countryCode,
          countryName: esim.countryName,
          qrCode: esim.qrCode,
          qrCodeUrl: esim.qrCodeUrl,
          directAppleInstallationUrl: esim.directAppleInstallationUrl,
          iccid: esim.iccid,
          lpa: esim.lpa,
          activationCode: esim.activationCode,
          smdpAddress: esim.smdpAddress,
          isTestMode: esim.isTestMode,
          sessionLost: esim.sessionLost
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching eSIMs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eSIMs', details: error.message },
      { status: 500 }
    );
  }
}
