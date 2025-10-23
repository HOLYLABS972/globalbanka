'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Yandex Login component
const YandexLogin = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleYandexLogin = async () => {
    setIsLoading(true);
    try {
      // Yandex OAuth implementation
      const yandexAppId = process.env.NEXT_PUBLIC_YANDEX_APP_ID || 'your-yandex-app-id';
      const redirectUri = `${window.location.origin}/auth/yandex/callback`;
      
      const yandexAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${yandexAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=login:email+login:info`;
      
      // Open Yandex auth popup
      const popup = window.open(yandexAuthUrl, 'yandex-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      // Listen for popup completion and messages
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          toast.error('Yandex authentication cancelled');
        }
      }, 1000);

      // Listen for messages from popup
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'YANDEX_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          setIsLoading(false);
          onSuccess(event.data.user);
        }
      };

      window.addEventListener('message', messageHandler);
      
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

// Google Login component
const GoogleLogin = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialResponse = useCallback((response) => {
    setIsLoading(true);
    
    try {
      // Decode the JWT token to get user information
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const userData = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        provider: 'google'
      };

      onSuccess(userData);
      
    } catch (err) {
      console.error('Error processing Google credential response:', err);
      toast.error('Failed to process Google login');
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  const initializeGoogleSignIn = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      toast.error('Google Client ID not configured');
      return;
    }
    
    if (window.google) {
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
            width: '100%'
          }
        );
      }
    }
  }, [handleCredentialResponse]);

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

  return (
    <div className="w-full">
      <div id="google-signin-button" className="w-full"></div>
    </div>
  );
};

// Email Login component
const EmailLogin = ({ onSuccess }) => {
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    userName: '',
    otpCode: '',
    enteredOtp: ''
  });
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);

  // Generate 6-digit OTP code
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send email with OTP
  const sendEmail = async () => {
    if (!emailData.email || !emailData.userName) {
      setEmailError('Please fill in all required fields');
      return;
    }

    setIsEmailLoading(true);
    setEmailError(null);
    setEmailSent(false);

    try {
      const otpCode = generateOTP();
      
      // Update state with generated OTP
      setEmailData(prev => ({ ...prev, otpCode }));
      
      // Log the OTP to console as requested
      console.log(`Generated OTP: ${otpCode}`);
      console.log(`Sending email to: ${emailData.email}`);
      
      // Construct the API URL with parameters
      const apiUrl = new URL('https://smtp.roamjet.net/api/email/send');
      apiUrl.searchParams.set('email', emailData.email);
      apiUrl.searchParams.set('project_id', 'u2LpTkbed1n7U4ff607n');
      apiUrl.searchParams.set('template_id', 'rAASNbN1sSGi9hZZjA9m');
      apiUrl.searchParams.set('user_name', emailData.userName);
      apiUrl.searchParams.set('otp_code', otpCode);

      console.log('API URL:', apiUrl.toString());

      // Use hidden iframe to bypass CORS and actually send the email
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = apiUrl.toString();
      
      iframe.onload = () => {
        setEmailSent(true);
        console.log('Email sent successfully!');
        document.body.removeChild(iframe);
      };
      
      iframe.onerror = () => {
        setEmailError('Failed to send email. Please try again.');
        document.body.removeChild(iframe);
      };
      
      document.body.appendChild(iframe);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
      console.error('Email sending error:', err);
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Handle form input changes
  const handleEmailInputChange = (field, value) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
    setEmailError(null);
    // Only reset emailSent if we're changing email or userName, not OTP
    if (field === 'email' || field === 'userName') {
      setEmailSent(false);
    }
    setOtpVerified(false);
  };

  // Verify OTP
  const verifyOTP = () => {
    if (emailData.enteredOtp === emailData.otpCode) {
      setOtpVerified(true);
      setEmailError(null);
      
      // Create user with email verification data
      const verifiedUser = {
        id: 'email-' + Date.now(),
        name: emailData.userName,
        email: emailData.email,
        picture: `https://via.placeholder.com/80x80/007acc/ffffff?text=${emailData.userName.charAt(0).toUpperCase()}`,
        provider: 'email'
      };
      
      onSuccess(verifiedUser);
      
      // Close email verification dialog
      setShowEmailVerification(false);
      
      // Reset email data
      setEmailData({
        email: '',
        userName: '',
        otpCode: '',
        enteredOtp: ''
      });
      setEmailSent(false);
      setEmailError(null);
      
    } else {
      setEmailError('Invalid OTP code. Please try again.');
    }
  };

  const openEmailVerification = () => {
    setShowEmailVerification(true);
    setEmailError(null);
    setEmailSent(false);
    setOtpVerified(false);
  };

  const closeEmailVerification = () => {
    setShowEmailVerification(false);
    setEmailData({
      email: '',
      userName: '',
      otpCode: '',
      enteredOtp: ''
    });
    setEmailError(null);
    setEmailSent(false);
    setOtpVerified(false);
  };

  return (
    <>
      <button
        onClick={openEmailVerification}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <Mail className="h-5 w-5 mr-2" />
        Continue with Email
      </button>

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📧 Email Verification</h3>
              <button
                onClick={closeEmailVerification}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {!emailSent ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your details to receive an OTP code via email:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address:
                      </label>
                      <input
                        type="email"
                        value={emailData.email}
                        onChange={(e) => handleEmailInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name:
                      </label>
                      <input
                        type="text"
                        value={emailData.userName}
                        onChange={(e) => handleEmailInputChange('userName', e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {emailError && (
                    <div className="text-red-600 text-sm mt-2">
                      {emailError}
                    </div>
                  )}

                  <button
                    onClick={sendEmail}
                    disabled={isEmailLoading || !emailData.email || !emailData.userName}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isEmailLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP Code'
                    )}
                  </button>
                </div>
              ) : !otpVerified ? (
                <div>
                  <div className="text-green-600 text-sm mb-4">
                    ✅ OTP sent to {emailData.email}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Enter the 6-digit code you received:
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OTP Code:
                    </label>
                    <input
                      type="text"
                      value={emailData.enteredOtp}
                      onChange={(e) => handleEmailInputChange('enteredOtp', e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  {emailError && (
                    <div className="text-red-600 text-sm mt-2">
                      {emailError}
                    </div>
                  )}

                  <button
                    onClick={verifyOTP}
                    disabled={emailData.enteredOtp.length !== 6}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify & Sign In
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </>
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
