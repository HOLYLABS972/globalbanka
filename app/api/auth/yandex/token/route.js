import { NextResponse } from 'next/server';
import connectDB from '../../../../../src/database/config';
import { AdminConfig } from '../../../../../src/database/models';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    // Load Yandex config from MongoDB only
    await connectDB();
    const config = await AdminConfig.findOne();
    
    const yandexAppId = config?.yandexAppId || '';
    const yandexAppSecret = config?.yandexAppSecret || '';
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://globalbanka.roamjet.net'}/auth/yandex/callback`;

    console.log('🔍 Server-side OAuth parameters:', {
      code,
      yandexAppId,
      redirectUri,
      hasSecret: !!yandexAppSecret,
      secretLength: yandexAppSecret ? yandexAppSecret.length : 0
    });

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: yandexAppId,
        client_secret: yandexAppSecret,
        redirect_uri: redirectUri,
      }),
    });

    console.log('🔍 Token response status:', tokenResponse.status);
    console.log('🔍 Token response ok:', tokenResponse.ok);

    const tokenData = await tokenResponse.json();
    console.log('🔍 Token exchange response:', tokenData);

    if (!tokenResponse.ok) {
      console.error('🔍 Token exchange failed with status:', tokenResponse.status);
      console.error('🔍 Token exchange error response:', tokenData);
      return NextResponse.json({ 
        error: `Token exchange failed: ${tokenData.error || tokenData.error_description || 'Unknown error'}` 
      }, { status: 400 });
    }

    if (tokenData.access_token) {
      // Get user info from Yandex
      const userResponse = await fetch('https://login.yandex.ru/info', {
        headers: {
          'Authorization': `OAuth ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();
      console.log('🔍 Yandex user data received:', userData);

      // Create user object with better email handling
      const user = {
        id: userData.id,
        name: userData.display_name || userData.real_name || userData.login,
        email: userData.default_email || userData.emails?.[0] || userData.email || null,
        picture: userData.default_avatar_id ? `https://avatars.yandex.net/get-yapic/${userData.default_avatar_id}/islands-200` : null,
        provider: 'yandex',
        // Additional fields for MongoDB
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        phone: userData.default_phone?.number || null,
        birthday: userData.birthday || null,
        gender: userData.sex || null
      };

      console.log('🔍 Processed user object:', user);

      // Import AuthService to handle Yandex sign-in
      const { default: authService } = await import('../../../../../src/services/authService');
      
      // Use AuthService to handle Yandex sign-in
      const result = await authService.signInWithYandex(user);
      
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
    }
  } catch (error) {
    console.error('Yandex token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
