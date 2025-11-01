"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { detectLanguageFromPath } from '../utils/languageUtils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: password
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [yandexAuthEnabled, setYandexAuthEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [yandexAppId, setYandexAppId] = useState('');
  const { login, signInWithGoogle } = useAuth();
  const { t, locale: contextLocale, changeLanguage } = useI18n();
  // Force Russian locale for login page
  const locale = 'ru';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Force Russian locale on mount
  React.useEffect(() => {
    if (contextLocale !== 'ru') {
      changeLanguage('ru');
    }
  }, [contextLocale, changeLanguage]);

  // Fetch auth status on mount
  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch('/api/config/auth-status');
        const data = await response.json();
        if (data.success) {
          setGoogleAuthEnabled(data.googleAuthEnabled);
          setYandexAuthEnabled(data.yandexAuthEnabled);
          setGoogleClientId(data.googleId);
          setYandexAppId(data.yandexAppId);
        }
      } catch (error) {
        console.error('Error fetching auth status:', error);
      }
    };
    
    fetchAuthStatus();
  }, []);

  // Get current language for localized URLs
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  
  // Debug language detection
  console.log('🔍 Login component language detection:', {
    locale,
    pathname,
    currentLanguage,
    savedLanguage: typeof window !== 'undefined' ? localStorage.getItem('roamjet-language') : 'N/A'
  });

  const getLocalizedUrl = (path) => {
    if (currentLanguage === 'en') {
      return path;
    }
    return `/${currentLanguage}${path}`;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(t('auth.login.fillEmailField', 'Please enter your email address'));
      return;
    }

    // Move to password step
    setStep(2);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      toast.error(t('auth.login.fillPasswordField', 'Please enter your password'));
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success(t('auth.login.loginSuccessful', 'Login successful!'));
      
      // Check for return URL parameter
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        // Default redirect to homepage with correct language
        const redirectPath = currentLanguage === 'en' ? '/' : `/${currentLanguage}/`;
        router.push(redirectPath);
      }
      
      // Preserve current language preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('roamjet-language', currentLanguage);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || t('auth.login.loginFailed', 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setPassword('');
  };



  const handleCredentialResponse = useCallback(async (response) => {
    setLoading(true);
    
    try {
      // Send the credential directly to our API
      const apiResponse = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      // Store auth data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Trigger auth state change event for AuthContext
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: data.user, token: data.token, action: 'login' } 
      }));
      
      toast.success(t('auth.login.googleSignInSuccess', 'Successfully signed in with Google'));
      router.push('/dashboard');
      
    } catch (err) {
      console.error('Google sign-in error:', err);
      toast.error(err.message || t('auth.login.googleSignInFailed', 'Failed to sign in with Google'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  const initializeYandexLogin = useCallback(() => {
    const appId = yandexAppId || process.env.NEXT_PUBLIC_YANDEX_APP_ID;
    
    if (!appId) {
      console.error('Yandex App ID not configured');
      return;
    }

    console.log('🔍 Initializing Yandex login...');
    console.log('🔍 YaSendSuggestToken available:', !!window.YaSendSuggestToken);

    // Initialize Yandex Passport SDK
    if (window.YaSendSuggestToken) {
      try {
        window.YaSendSuggestToken('https://globalbanka.roamjet.net/login', {
          client_id: appId,
          response_type: 'code',
          redirect_uri: 'https://globalbanka.roamjet.net/auth/yandex/callback',
          scope: 'login:email login:info',
          popup: true,
          onSuccess: (data) => {
            console.log('Yandex authentication success:', data);
            // Handle successful authentication
            const user = {
              id: data.id,
              name: data.display_name || data.real_name || data.login,
              email: data.default_email,
              picture: data.default_avatar_id ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200` : null,
              provider: 'yandex'
            };
            
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('authToken', 'yandex-token');
            
            toast.success(t('auth.login.yandexSignInSuccess', 'Successfully signed in with Yandex'));
            router.push('/dashboard');
          },
          onError: (error) => {
            console.error('Yandex authentication error:', error);
            toast.error(t('auth.login.yandexSignInFailed', 'Failed to sign in with Yandex'));
          }
        });
        console.log('🔍 Yandex SDK initialized successfully');
      } catch (error) {
        console.error('Error initializing Yandex SDK:', error);
        // Fallback to custom button
        createFallbackButton();
      }
    } else {
      console.error('YaSendSuggestToken not available, creating fallback button');
      // Fallback to custom button
      createFallbackButton();
    }
  }, [router, t, yandexAppId]);

  const createFallbackButton = useCallback(() => {
    const buttonContainer = document.getElementById('yandex-login-button');
    if (buttonContainer) {
      buttonContainer.innerHTML = `
        <button
          type="button"
          class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          onclick="window.handleYandexLoginFallback && window.handleYandexLoginFallback()"
        >
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#FF0000"/>
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#FF0000"/>
            <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Я</text>
          </svg>
          Sign in with Yandex
        </button>
      `;
    }
  }, []);

  const handleYandexLoginFallback = useCallback(() => {
    const appId = yandexAppId || process.env.NEXT_PUBLIC_YANDEX_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/auth/yandex/callback`;
    
    if (!appId) {
      toast.error('Yandex App ID not configured');
      return;
    }

    // Open Yandex OAuth in popup
    const popup = window.open(
      `https://oauth.yandex.ru/authorize?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      'yandex-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    // Listen for messages from popup
    const messageListener = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'YANDEX_AUTH_SUCCESS') {
        const { user, token } = event.data;
        
        console.log('🔍 Received Yandex auth success message:', { user, token });
        
        // Store auth data in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Preserve current language preference (use component-level currentLanguage)
        localStorage.setItem('roamjet-language', currentLanguage);
        
        // Trigger custom event to notify AuthContext of login
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { user, token, action: 'login' } 
        }));
        
        toast.success(t('auth.login.yandexSignInSuccess', 'Successfully signed in with Yandex'));
        
        // Close popup first
        if (popup && !popup.closed) {
          popup.close();
        }
        
        // Remove listener
        window.removeEventListener('message', messageListener);
        
        // Small delay to ensure popup closes before redirect
        setTimeout(() => {
          console.log('🔍 Redirecting to dashboard...');
          console.log('🔍 Current URL:', window.location.href);
          console.log('🔍 Search params:', new URLSearchParams(window.location.search));
          console.log('🔍 Preserved language:', currentLanguage);
          
          // Redirect to dashboard
          router.push('/dashboard');
        }, 100);
      } else if (event.data.type === 'YANDEX_AUTH_ERROR') {
        const { error } = event.data;
        console.error('Yandex authentication error from popup:', error);
        toast.error(t('auth.login.yandexSignInFailed', 'Failed to sign in with Yandex'));
        
        popup.close();
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);

    // Cleanup if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
      }
    }, 1000);
  }, [router, t, yandexAppId, currentLanguage]);

  const initializeGoogleSignIn = useCallback(() => {
    const clientId = googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.log('Google Client ID not configured');
      return;
    }
    
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the sign-in button
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        window.google.accounts.id.renderButton(
          buttonElement,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
          }
        );
      }
    }
  }, [handleCredentialResponse, googleClientId]);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [initializeGoogleSignIn]);

  // Re-initialize Google login when Client ID changes
  useEffect(() => {
    if (googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
      initializeGoogleSignIn();
    }
  }, [googleClientId, initializeGoogleSignIn]);

  // Removed complex SDK initialization - using simple button approach


  return (
    <div className="min-h-screen flex bg-[#1a202c]">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-4 lg:px-16 xl:px-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-sm w-full"
        >
          <div>
            <h2 className="text-center text-3xl font-semibold text-white" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {t('auth.login.title', 'Sign in to your account')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              {t('auth.login.subtitle', 'Or')}{' '}
              <Link
                href="/register"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                {t('auth.login.createAccount', 'create a new account')}
              </Link>
            </p>
          </div>
          
          {step === 1 ? (
            <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="form-label">
                    {t('auth.login.emailLabel', 'Email address')}
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-12"
                      placeholder="Введите ваш email"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    t('auth.login.continueButton', 'Continue')
                  )}
                </button>
              </div>
              
              <div className="text-center">
                                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                  {t('auth.login.forgotPassword', 'Forgot your password?')}
                </Link>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-300">
                    Введите пароль для
                  </p>
                  <p className="font-medium text-white">{email}</p>
                </div>
                
                <div>
                  <label htmlFor="password" className="form-label">
                    {t('auth.login.passwordLabel', 'Password')}
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-12 pr-12"
                      placeholder="Введите ваш пароль"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {t('auth.login.forgotPassword', 'Forgot your password?')}
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Вернуться к email
                </button>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    t('auth.login.signInButton', 'Sign in')
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Social OAuth buttons - show only if enabled */}
          {(googleAuthEnabled || yandexAuthEnabled) && (
          <div className="mt-6 space-y-4">
            {/* Yandex Login Button */}
              {yandexAuthEnabled && (
            <button
              type="button"
              onClick={handleYandexLoginFallback}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors min-h-[52px]"
            >
              {/* Yandex Logo */}
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#FF0000"/>
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#FF0000"/>
                <text x="12" y="16" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Я</text>
              </svg>
              {t('auth.login.signInWithYandex', 'Sign in with Yandex')}
            </button>
              )}

              {googleAuthEnabled && yandexAuthEnabled && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-jordy-blue opacity-30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-cool-black " style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {t('auth.login.orContinueWith', 'Or continue with')}
                </span>
              </div>
            </div>
              )}
            
              {googleAuthEnabled && (
            <div id="google-signin-button"></div>
              )}
          </div>
          )}
        </motion.div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="/images/logo_icon/vwvw.avif"
            alt="Travel background"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;