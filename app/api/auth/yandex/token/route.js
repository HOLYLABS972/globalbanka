import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    const yandexAppId = process.env.NEXT_PUBLIC_YANDEX_APP_ID;
    const yandexAppSecret = process.env.YANDEX_APP_SECRET;
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

      // Create user object
      const user = {
        id: userData.id,
        name: userData.display_name || userData.real_name || userData.login,
        email: userData.default_email,
        picture: userData.default_avatar_id ? `https://avatars.yandex.net/get-yapic/${userData.default_avatar_id}/islands-200` : null,
        provider: 'yandex'
      };

      console.log('🔍 Processed user object:', user);

      return NextResponse.json({ user });
    } else {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
    }
  } catch (error) {
    console.error('Yandex token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
