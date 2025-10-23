// API URLs - Change these URLs as needed
const API_URL = 'https://api.roamjet.net';  // For public data (countries, plans)
const ORDER_URL = 'https://sandbox.roamjet.net';  // For order creation

import authService from './authService';
import { BusinessUser } from '../database/models';
import connectDB from '../database/config';

/**
 * Get JWT token for current user
 * @returns {Promise<string>} JWT token
 */
const getAuthToken = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No user logged in');
    }
    
    // Verify token is still valid
    await authService.verifyAuthToken(token);
    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    throw error;
  }
};

/**
 * Get RoamJet API key from environment or user's MongoDB document
 * @returns {Promise<string>} API key
 */
export const getApiKey = async () => {
  try {
    // First try environment variable
    const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
    if (roamjetApiKey) {
      console.log('🔑 Using RoamJet API key from environment:', roamjetApiKey.substring(0, 15) + '...');
      return roamjetApiKey;
    }
    
    // Then try from authenticated user's business_users collection
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const user = await authService.verifyAuthToken(token);
        console.log('🔍 Getting API key for user:', user._id);
        
        await connectDB();
        const businessUser = await BusinessUser.findOne({ userId: user._id });
        
        if (businessUser && businessUser.apiCredentials && businessUser.apiCredentials.apiKey) {
          console.log('🔑 Using RoamJet API key from user document:', businessUser.apiCredentials.apiKey.substring(0, 15) + '...');
          return businessUser.apiCredentials.apiKey;
        }
      } catch (error) {
        console.error('❌ Error getting API key from user document:', error);
      }
    }
    
    throw new Error('RoamJet API key not configured. Please contact support.');
  } catch (error) {
    console.error('❌ Error getting RoamJet API key:', error.message);
    throw error;
  }
};

/**
 * Make authenticated request to API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  try {
    const authToken = await getAuthToken();
    const apiKey = await getApiKey();
    
    console.log('🌐 Using PUBLIC API:', API_URL);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API request failed:', {
        status: response.status,
        error: data.error,
        fullResponse: data
      });
      throw new Error(`Request failed. Please contact support.`);
    }
    
    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiService = {
  /**
   * Create eSIM order
   * @param {Object} orderData - Order data
   * @param {string} orderData.package_id - Package ID
   * @param {string} orderData.quantity - Quantity (default: "1")
   * @param {string} orderData.to_email - Customer email
   * @param {string} orderData.description - Order description
   * @param {string} orderData.mode - Mode (test/live) - tells backend whether to use mock or real data
   * @returns {Promise<Object>} Order result with orderId and airaloOrderId
   */
  async createOrder({ package_id, quantity = "1", to_email, description, mode }) {
    console.log('📦 Creating order via API:', { package_id, quantity, to_email, mode });
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('authToken');
      const isLoggedIn = !!token;
      
      console.log('🔐 User logged in:', isLoggedIn);
      
      // Use public endpoint for non-logged-in users (like localhost)
      if (!isLoggedIn) {
        console.log('🌐 Using PUBLIC test order endpoint:', ORDER_URL);
        const response = await fetch(`${ORDER_URL}/api/public/test-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            package_id,
            to_email,
            description,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error('❌ API request failed:', {
            status: response.status,
            error: result.error,
            fullResponse: result
          });
          throw new Error(`Request failed. Please contact support.`);
        }

        console.log('✅ Order created:', result);
        return result;
      }
      
      console.log('🔧 Using authenticated endpoint for logged-in user');
      const authToken = await getAuthToken();
      const apiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
      if (!apiKey) {
        throw new Error('RoamJet API key not configured');
      }
      
      console.log('🌐 Using AUTHENTICATED order endpoint:', ORDER_URL);
      console.log('🔑 API Key:', apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING');
      console.log('🔐 Auth Token:', authToken ? 'Present' : 'MISSING');
      console.log('🔐 Auth Token length:', authToken ? authToken.length : 0);
      console.log('🔑 API Key length:', apiKey ? apiKey.length : 0);
      
      const requestBody = {
        package_id,
        quantity,
        to_email,
        description,
        mode,
      };
      
      console.log('📦 Request body:', requestBody);
      
      const response = await fetch(`${ORDER_URL}/api/user/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ API request failed:', {
          status: response.status,
          error: result.error,
          fullResponse: result
        });
        throw new Error(`Request failed. Please contact support.`);
      }

      console.log('✅ Order created:', result);
      return result;
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      throw new Error(`Order creation failed. Please contact support.`);
    }
  },

  /**
   * Get QR code for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} QR code data
   */
  async getQrCode(orderId) {
    console.log('📱 Getting QR code via Python API for order:', orderId);
    
    const result = await makeAuthenticatedRequest('/api/user/qr-code', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });

    console.log('✅ QR code retrieved:', result.success);
    return result;
  },

  /**
   * Get SIM details by ICCID
   * @param {string} iccid - SIM ICCID
   * @returns {Promise<Object>} SIM details
   */
  async getSimDetails(iccid) {
    console.log('📱 Getting SIM details via Python API for ICCID:', iccid);
    
    const result = await makeAuthenticatedRequest('/api/user/sim-details', {
      method: 'POST',
      body: JSON.stringify({ iccid }),
    });

    console.log('✅ SIM details retrieved');
    return result;
  },

  /**
   * Get SIM usage by ICCID
   * @param {string} iccid - SIM ICCID
   * @returns {Promise<Object>} Usage data
   */
  async getSimUsage(iccid) {
    console.log('📊 Getting SIM usage via Python API for ICCID:', iccid);
    
    const result = await makeAuthenticatedRequest('/api/user/sim-usage', {
      method: 'POST',
      body: JSON.stringify({ iccid }),
    });

    console.log('✅ SIM usage retrieved');
    return result;
  },

  /**
   * Get user balance
   * @returns {Promise<Object>} Balance data
   */
  async getBalance() {
    console.log('💰 Getting user balance via Python API');
    
    const result = await makeAuthenticatedRequest('/api/user/balance', {
      method: 'GET',
    });

    console.log('✅ Balance retrieved:', result.balance);
    return result;
  }
};

export default apiService;
