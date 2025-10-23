'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import authService from '../services/authService'; // Removed - causes client-side issues

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setUserProfile(user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  async function signup(email, password, displayName, referralCode) {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName, referralCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      setCurrentUser(data.user);
      setUserProfile(data.user);
      
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      // Clear auth data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  }

  async function resetPassword(email) {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async function signInWithGoogle(googleUser) {
    throw new Error('Google authentication is currently disabled');
  }

  async function verifyEmailOTP(otp) {
    try {
      // Get pending signup data from localStorage
      const pendingSignupData = localStorage.getItem('pendingSignup');
      if (!pendingSignupData) {
        throw new Error('No pending signup found');
      }

      const pendingSignup = JSON.parse(pendingSignupData);
      
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, pendingSignupData: pendingSignup }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Email verification failed');
      }

      // Store auth data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Clear pending signup data
      localStorage.removeItem('pendingSignup');
      
      setCurrentUser(data.user);
      setUserProfile(data.user);
      
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async function verifyPasswordResetOTP(email, otp, newPassword) {
    try {
      const response = await fetch('/api/auth/verify-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset verification failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async function updateUserProfile(updates) {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id, updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }

      // Update stored user data
      const updatedUserData = { ...currentUser, ...updates };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      setCurrentUser(updatedUserData);
      setUserProfile(updatedUserData);
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  const loadUserProfile = useCallback(async () => {
    if (currentUser) {
      try {
        console.log('🔍 AuthContext: Loading user profile for:', currentUser.email);
        console.log('🆔 AuthContext: User ID:', currentUser.id);
        
        const response = await fetch(`/api/auth/user?userId=${currentUser.id}`);
        const user = await response.json();
        
        if (response.ok) {
          console.log('📋 AuthContext: User profile loaded:', user);
          setUserProfile(user);
        } else {
          console.log('❌ AuthContext: No user profile found');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error loading user profile:', error);
      }
    }
  }, [currentUser]);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('authToken');
      if (token && currentUser) {
        try {
          const response = await fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          if (!response.ok) {
            throw new Error('Token verification failed');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
    };

    if (currentUser) {
      verifyToken();
    }
  }, [currentUser]);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    verifyEmailOTP,
    verifyPasswordResetOTP,
    updateUserProfile,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}