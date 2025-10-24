import crypto from 'crypto';

// Robokassa configuration
const ROBOKASSA_CONFIG = {
  merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || 'your_merchant_login',
  passOne: process.env.ROBOKASSA_PASS_ONE || 'your_pass_one',
  passTwo: process.env.ROBOKASSA_PASS_TWO || 'your_pass_two',
  mode: process.env.ROBOKASSA_MODE || 'test', // test or production
  baseUrl: process.env.ROBOKASSA_BASE_URL || 'https://auth.robokassa.ru/Merchant/Index.aspx'
};

// Server payments service URL - payments go to pay.roamjet.net
const SERVER_PAYMENTS_URL = 'https://pay.roamjet.net';

/**
 * Generate MD5 hash for Robokassa signature
 */
function generateSignature(params, password) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join(':');
  
  const signatureString = `${sortedParams}:${password}`;
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Generate Robokassa payment URL
 */
function generatePaymentUrl(orderData) {
  const {
    orderId,
    amount,
    description,
    email,
    currency = 'RUB',
    culture = 'ru',
    successUrl,
    failUrl
  } = orderData;

  // Convert amount to kopecks (Robokassa uses kopecks)
  const amountInKopecks = Math.round(amount * 100);

  const params = {
    MerchantLogin: ROBOKASSA_CONFIG.merchantLogin,
    OutSum: amountInKopecks,
    InvId: orderId,
    Description: description,
    Email: email,
    Culture: culture,
    Encoding: 'utf-8',
    SignatureValue: ''
  };

  // Add success and fail URLs if provided
  if (successUrl) {
    params.SuccessURL = successUrl;
  }
  if (failUrl) {
    params.FailURL = failUrl;
  }

  // Generate signature
  params.SignatureValue = generateSignature(params, ROBOKASSA_CONFIG.passOne);

  // Build URL
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  return `${ROBOKASSA_CONFIG.baseUrl}?${queryString}`;
}

/**
 * Verify Robokassa callback signature
 */
function verifyCallbackSignature(params) {
  const { OutSum, InvId, SignatureValue } = params;
  
  const verificationParams = {
    OutSum,
    InvId,
    PassTwo: ROBOKASSA_CONFIG.passTwo
  };

  const expectedSignature = generateSignature(verificationParams, ROBOKASSA_CONFIG.passTwo);
  return expectedSignature.toLowerCase() === SignatureValue.toLowerCase();
}

export const robokassaService = {
  /**
   * Create payment and redirect to Robokassa
   */
  async createPayment(orderData) {
    try {
      console.log('🔄 Creating Robokassa payment:', orderData);
      
      const paymentUrl = generatePaymentUrl({
        orderId: orderData.orderId,
        amount: orderData.amount,
        description: orderData.description || orderData.planName || 'eSIM Package',
        email: orderData.customerEmail,
        currency: orderData.currency || 'RUB',
        successUrl: `${window.location.origin}/payment-success?order=${orderData.orderId}`,
        failUrl: `${window.location.origin}/payment-failed?order=${orderData.orderId}`
      });

      console.log('✅ Robokassa payment URL generated:', paymentUrl);
      
      // Redirect to Robokassa payment page
      window.location.href = paymentUrl;
      
      return { paymentUrl, success: true };
    } catch (error) {
      console.error('❌ Error creating Robokassa payment:', error);
      throw error;
    }
  },

  /**
   * Create payment via server (for single orders)
   */
  async createCheckoutSession(orderData) {
    try {
      const endpoint = '/create-robokassa-payment';
      console.log('🔍 Creating Robokassa payment via server:', orderData);
      console.log('🌐 Payment server URL:', SERVER_PAYMENTS_URL);
      console.log('🎯 Using endpoint:', endpoint);
      
      const response = await fetch(`${SERVER_PAYMENTS_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: orderData.orderId,
          email: orderData.customerEmail,
          name: orderData.planName,
          total: orderData.amount,
          currency: orderData.currency || 'RUB',
          domain: window.location.origin,
          description: orderData.description || orderData.planName || 'eSIM Package'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Robokassa payment created via server:', result);
      
      // Redirect to Robokassa payment page
      if (result.paymentUrl) {
        console.log('🔄 Redirecting to Robokassa payment page:', result.paymentUrl);
        window.location.href = result.paymentUrl;
      } else {
        console.error('❌ Server response missing paymentUrl:', result);
        throw new Error('No payment URL received from server');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error creating Robokassa checkout session:', error);
      throw error;
    }
  },

  /**
   * Verify payment callback from Robokassa
   */
  async verifyPayment(params) {
    try {
      console.log('🔍 Verifying Robokassa payment:', params);
      
      const isValid = verifyCallbackSignature(params);
      
      if (isValid) {
        console.log('✅ Robokassa payment verified successfully');
        return {
          success: true,
          orderId: params.InvId,
          amount: params.OutSum / 100, // Convert from kopecks
          signature: params.SignatureValue
        };
      } else {
        console.error('❌ Invalid Robokassa payment signature');
        return {
          success: false,
          error: 'Invalid signature'
        };
      }
    } catch (error) {
      console.error('❌ Error verifying Robokassa payment:', error);
      throw error;
    }
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId) {
    try {
      const endpoint = '/robokassa-payment-status';
      console.log('🔍 Getting Robokassa payment status for order:', orderId);
      
      const response = await fetch(`${SERVER_PAYMENTS_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Robokassa payment status retrieved:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error getting Robokassa payment status:', error);
      throw error;
    }
  },

  /**
   * Get Robokassa configuration
   */
  getConfig() {
    return {
      merchantLogin: ROBOKASSA_CONFIG.merchantLogin,
      mode: ROBOKASSA_CONFIG.mode,
      baseUrl: ROBOKASSA_CONFIG.baseUrl
    };
  }
};
