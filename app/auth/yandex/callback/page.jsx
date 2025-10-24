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
          console.log('🔍 Authorization code received:', code);
          
          // Call our API route to exchange code for token
          const response = await fetch('/api/auth/yandex/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();
          console.log('🔍 API response:', data);

          if (!response.ok) {
            throw new Error(data.error || 'Token exchange failed');
          }

          if (data.user && data.token) {
            const user = data.user;
            const token = data.token;
            
            // Store user data and token
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(user));
            
            // Close popup and notify parent window
            if (window.opener) {
              console.log('🔍 Sending message to parent window:', { type: 'YANDEX_AUTH_SUCCESS', user, token });
              window.opener.postMessage({ type: 'YANDEX_AUTH_SUCCESS', user, token }, window.location.origin);
              window.close();
            } else {
              // If not in popup, redirect to share package page
              toast.success(`Welcome, ${user.displayName || user.email}!`);
              
              // Check for return URL parameter
              const returnUrl = searchParams.get('returnUrl');
              if (returnUrl) {
                router.push(decodeURIComponent(returnUrl));
              } else {
                // Default redirect to share package page
                router.push('/share-package');
              }
            }
          } else {
            throw new Error('No user data or token received');
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
