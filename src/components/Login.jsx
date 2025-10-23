"use client";

import React, { useState } from 'react';
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
  const { login } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const getLocalizedUrl = (path) => {
    if (currentLanguage === 'en') {
      return path;
    }
    return `/${currentLanguage}${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('auth.login.fillAllFields', 'Please fill in all fields'));
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
        // Default redirect to homepage (not dashboard)
        router.push('/');
      }
      
      // Save English as preferred language
      if (typeof window !== 'undefined') {
        localStorage.setItem('roamjet-language', 'en');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || t('auth.login.loginFailed', 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    toast.error(t('auth.login.googleSignInDisabled', 'Google authentication is currently disabled'));
  };


  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-4 lg:px-16 xl:px-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-sm w-full"
        >
          <div>
            <h2 className="text-center text-3xl font-semibold text-eerie-black">
              {t('auth.login.title', 'Sign in to your account')}
            </h2>
            <p className="mt-2 text-center text-sm text-cool-black">
              {t('auth.login.subtitle', 'Or')}{' '}
              <Link
                href={getLocalizedUrl('/register')}
                className="font-semibold text-tufts-blue hover:text-cobalt-blue transition-colors"
              >
                {t('auth.login.createAccount', 'create a new account')}
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label">
                  {t('auth.login.emailLabel', 'Email address')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-cool-black opacity-60" />
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
                    placeholder={t('auth.login.emailPlaceholder', 'Enter your email')}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="form-label">
                  {t('auth.login.passwordLabel', 'Password')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-cool-black opacity-60" />
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
                    placeholder={t('auth.login.passwordPlaceholder', 'Enter your password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-cool-black opacity-60" />
                    ) : (
                      <Eye className="h-5 w-5 text-cool-black opacity-60" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-semibold text-tufts-blue hover:text-cobalt-blue transition-colors"
                >
                  {t('auth.login.forgotPassword', 'Forgot your password?')}
                </Link>
              </div>
            </div>

            <div>
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
        </motion.div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0">
          <img
            className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
            src=" /images/logo_icon/vwvw.avif"
            alt="Travel background"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
