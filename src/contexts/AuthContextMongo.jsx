'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService';

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

  async function signup(email, password, displayName) {
    try {
      const result = await authService.signup(email, password, displayName);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const result = await authService.login(email, password);
      
      // Store auth data in localStorage
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      setCurrentUser(result.user);
      setUserProfile(result.user);
      
      return result.user;
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
      const result = await authService.resetPassword(email);
      return result;
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
      const result = await authService.verifyEmailOTP(otp, pendingSignup);
      
      // Store auth data in localStorage
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      // Clear pending signup data
      localStorage.removeItem('pendingSignup');
      
      setCurrentUser(result.user);
      setUserProfile(result.user);
      
      return result.user;
    } catch (error) {
      throw error;
    }
  }

  async function verifyPasswordResetOTP(email, otp, newPassword) {
    try {
      const result = await authService.verifyPasswordResetOTP(email, otp, newPassword);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async function updateUserProfile(updates) {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const updatedUser = await authService.updateUserProfile(currentUser.id, updates);
      
      // Update stored user data
      const updatedUserData = { ...currentUser, ...updates };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      setCurrentUser(updatedUserData);
      setUserProfile(updatedUserData);
      
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  const loadUserProfile = useCallback(async () => {
    if (currentUser) {
      try {
        console.log('🔍 AuthContext: Loading user profile for:', currentUser.email);
        console.log('🆔 AuthContext: User ID:', currentUser.id);
        
        const user = await authService.getUserById(currentUser.id);
        console.log('📋 AuthContext: User profile loaded:', user);
        
        if (user) {
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
          await authService.verifyAuthToken(token);
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
