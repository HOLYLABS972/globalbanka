
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
    
    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    throw error;
  }
};

/**
 * Get RoamJet API key from environment
 * @returns {Promise<string>} API key
 */
export const getApiKey = async () => {
  try {
    // Debug ALL environment variables to see what's available
    console.log('🔍 All environment variables:', Object.keys(process.env));
    console.log('🔍 All NEXT_PUBLIC env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
    console.log('🔍 NEXT_PUBLIC_ROAMJET_API_KEY exists:', !!process.env.NEXT_PUBLIC_ROAMJET_API_KEY);
    console.log('🔍 NEXT_PUBLIC_ROAMJET_API_KEY value:', process.env.NEXT_PUBLIC_ROAMJET_API_KEY);
    console.log('🔍 NEXT_PUBLIC_ROAMJET_API_KEY length:', process.env.NEXT_PUBLIC_ROAMJET_API_KEY?.length || 0);
    
    // Use environment variable only
    const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
    if (roamjetApiKey && roamjetApiKey.trim()) {
      console.log('🔑 Using RoamJet API key from environment:', roamjetApiKey.substring(0, 15) + '...');
      return roamjetApiKey.trim();
    }
    
    // Check for alternative environment variable names
    const altApiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.ROAMJET_API_KEY;
    if (altApiKey && altApiKey.trim()) {
      console.log('🔑 Using alternative API key from environment:', altApiKey.substring(0, 15) + '...');
      return altApiKey.trim();
    }
    
    // Fallback API key
    const fallbackApiKey = 'rjapi_2k9lt4821123xd7p2dl37mv48jukgo51';
    console.log('🔑 Using fallback API key:', fallbackApiKey.substring(0, 15) + '...');
    return fallbackApiKey;
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
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
    
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
      
      const ORDER_URL = process.env.NEXT_PUBLIC_ORDER_URL || 'https://sandbox.roamjet.net';
      
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
