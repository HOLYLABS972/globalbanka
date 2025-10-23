'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Yandex Login component - Redirect-based authentication
const YandexLogin = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleYandexLogin = async () => {
    setIsLoading(true);
    try {
      const yandexAppId = process.env.NEXT_PUBLIC_YANDEX_APP_ID || 'your-yandex-app-id';
      const redirectUri = `${window.location.origin}/auth/yandex/callback`;
      
      const yandexAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${yandexAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=login:email+login:info`;
      
      // Redirect to Yandex OAuth instead of popup
      window.location.href = yandexAuthUrl;
      
    } catch (error) {
      console.error('Yandex login error:', error);
      toast.error('Yandex authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleYandexLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
      ) : (
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      )}
      {isLoading ? 'Connecting to Yandex...' : 'Continue with Yandex'}
    </button>
  );
};

// Google Login component - Redirect-based authentication
const GoogleLogin = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        toast.error('Google Client ID not configured');
        setIsLoading(false);
        return;
      }

      // Create Google OAuth URL for redirect-based authentication
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'openid email profile';
      const responseType = 'code';
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=${responseType}&` +
        `access_type=offline&` +
        `prompt=consent`;

      // Redirect to Google OAuth
      window.location.href = googleAuthUrl;
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      Continue with Google
    </button>
  );
};

// Email Login component - Redirect to login page
const EmailLogin = ({ onSuccess }) => {
  const router = useRouter();
  
  const handleEmailLogin = () => {
    // Redirect to the login page instead of showing modal
    router.push('/login');
  };

  return (
    <button
      onClick={handleEmailLogin}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      <Mail className="h-5 w-5 mr-2" />
      Continue with Email
    </button>
  );
};

// Main Auth component
const Auth = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = async (userData) => {
    setIsLoading(true);
    try {
      // Handle different authentication providers
      if (userData.provider === 'google') {
        // For Google auth, we'll need to implement this in the auth service
        toast.success(`Welcome, ${userData.name}!`);
        // Store user data temporarily
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/dashboard');
      } else if (userData.provider === 'email') {
        // For email auth, use the existing auth service
        await login(userData.email, 'dummy-password'); // We'll need to modify this
        toast.success(`Welcome, ${userData.name}!`);
        router.push('/dashboard');
      } else if (userData.provider === 'yandex') {
        // For Yandex auth
        toast.success(`Welcome, ${userData.name}!`);
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth success error:', error);
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <button
            onClick={handleBackToHome}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>
          
          <h2 className="text-center text-3xl font-semibold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your preferred sign-in method
          </p>
        </div>
        
        <div className="space-y-4">
          <EmailLogin onSuccess={handleAuthSuccess} />
          
          <GoogleLogin onSuccess={handleAuthSuccess} />
          
          {/* <YandexLogin onSuccess={handleAuthSuccess} /> */}
        </div>
        
        {isLoading && (
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-sm text-gray-600">Signing you in...</p>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
