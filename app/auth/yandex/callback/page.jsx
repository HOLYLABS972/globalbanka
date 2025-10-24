'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function YandexCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleYandexCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          console.error('Yandex OAuth error:', error);
          toast.error('Yandex authentication failed');
          
          // Handle popup communication for errors too
          if (window.opener) {
            console.log('🔍 Sending error message to parent window:', { type: 'YANDEX_AUTH_ERROR', error });
            window.opener.postMessage({ type: 'YANDEX_AUTH_ERROR', error }, window.location.origin);
            window.close();
          } else {
            router.push('/auth');
          }
          return;
        }

        if (code) {
          // Exchange code for access token
          const yandexAppId = process.env.NEXT_PUBLIC_YANDEX_APP_ID;
          const yandexAppSecret = process.env.YANDEX_APP_SECRET;
          const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/auth/yandex/callback`;

          console.log('🔍 OAuth parameters:', {
            code,
            yandexAppId,
            redirectUri,
            hasSecret: !!yandexAppSecret
          });

          const tokenParams = {
            grant_type: 'authorization_code',
            code: code,
            client_id: yandexAppId,
            client_secret: yandexAppSecret,
            redirect_uri: redirectUri,
          };
          
          console.log('🔍 Token request parameters:', tokenParams);
          
          const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(tokenParams),
          });

          console.log('🔍 Token response status:', tokenResponse.status);
          console.log('🔍 Token response ok:', tokenResponse.ok);
          
          const tokenData = await tokenResponse.json();
          console.log('🔍 Token exchange response:', tokenData);

          if (!tokenResponse.ok) {
            console.error('🔍 Token exchange failed with status:', tokenResponse.status);
            console.error('🔍 Token exchange error response:', tokenData);
            throw new Error(`Token exchange failed: ${tokenData.error || tokenData.error_description || 'Unknown error'}`);
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
              picture: `https://avatars.yandex.net/get-yapic/${userData.default_avatar_id}/islands-200`,
              provider: 'yandex'
            };
            
            console.log('🔍 Processed user object:', user);

            // Store user data
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authToken', 'yandex-token'); // You might want to generate a proper token
            
            // Close popup and notify parent window
            if (window.opener) {
              console.log('🔍 Sending message to parent window:', { type: 'YANDEX_AUTH_SUCCESS', user });
              window.opener.postMessage({ type: 'YANDEX_AUTH_SUCCESS', user }, window.location.origin);
              window.close();
            } else {
              // If not in popup, redirect to dashboard
              toast.success(`Welcome, ${user.name}!`);
              router.push('/dashboard');
            }
          } else {
            throw new Error('Failed to get access token');
          }
        } else {
          throw new Error('No authorization code received');
        }
      } catch (error) {
        console.error('Yandex callback error:', error);
        toast.error('Yandex authentication failed');
        
        // Handle popup communication for catch errors too
        if (window.opener) {
          console.log('🔍 Sending catch error message to parent window:', { type: 'YANDEX_AUTH_ERROR', error: error.message });
          window.opener.postMessage({ type: 'YANDEX_AUTH_ERROR', error: error.message }, window.location.origin);
          window.close();
        } else {
          router.push('/auth');
        }
      }
    };

    handleYandexCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing Yandex authentication...</p>
      </div>
    </div>
  );
}

export default function YandexCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <YandexCallbackContent />
    </Suspense>
  );
}
