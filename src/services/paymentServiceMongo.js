import { loadStripe } from '@stripe/stripe-js';
import configService from './configServiceMongo';

// Server payments service URL
const SERVER_PAYMENTS_URL = 'https://pay.roamjet.net';

// Stripe instance cache
let stripeInstance = null;
let currentStripeMode = null;

// Get or initialize Stripe with the correct key for current mode
async function getStripeInstance() {
  try {
    const mode = await configService.getStripeMode();
    
    // If mode changed, reinitialize Stripe
    if (mode !== currentStripeMode || !stripeInstance) {
      currentStripeMode = mode;
      const publishableKey = await configService.getStripePublishableKey(mode);
      
      if (publishableKey) {
        console.log(`🔑 Loading Stripe in ${mode.toUpperCase()} mode`);
        stripeInstance = await loadStripe(publishableKey);
      } else {
        console.warn('⚠️ No Stripe publishable key found');
        stripeInstance = null;
      }
    }
    
    return stripeInstance;
  } catch (error) {
    console.error('❌ Error loading Stripe:', error);
    return null;
  }
}

export const paymentService = {
  // Create payment intent and redirect to external payment page
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      console.log('🔍 Creating payment redirect with:', { amount, currency, metadata });
      
      // Use external payment service instead of Firebase Functions
      const endpoint = await this.getEndpoint('/create-payment-intent');
      console.log('🔍 Creating payment intent:', { amount, currency, endpoint });
      
      const response = await fetch(`${SERVER_PAYMENTS_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Payment intent created:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  },

  // Confirm payment (not needed for external redirect flow)
  async confirmPayment(paymentIntentId) {
    try {
      console.log('✅ Payment confirmed via external service:', paymentIntentId);
      return { status: 'confirmed' };
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Get Stripe instance
  async getStripe() {
    return await getStripeInstance();
  },

  // Get the appropriate endpoint based on mode
  async getEndpoint(endpoint) {
    const mode = await configService.getStripeMode();
    const isTestMode = mode === 'test' || mode === 'sandbox';
    
    if (isTestMode) {
      // Use test routes for test mode
      const testEndpoint = `/test${endpoint}`;
      console.log(`🧪 TEST MODE: Using test endpoint ${testEndpoint}`);
      return testEndpoint;
    }
    
    return endpoint;
  },

  // Create checkout session - USE YOUR SERVER (SINGLE ORDER)
  async createCheckoutSession(orderData) {
    try {
      const endpoint = await this.getEndpoint('/create-payment-order');
      console.log('🔍 Creating single order checkout via server:', orderData);
      console.log('🌐 Payment server URL:', SERVER_PAYMENTS_URL);
      console.log('🎯 Using endpoint:', endpoint);
      
      // Use your server's create-payment-order endpoint for single orders
      const response = await fetch(`${SERVER_PAYMENTS_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: orderData.orderId, // Use unique order ID instead of plan ID
          email: orderData.customerEmail,
          name: orderData.planName,
          total: orderData.amount,
          currency: orderData.currency || 'usd',
          domain: window.location.origin
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Single order checkout created via server:', result);
      
      // Redirect to Stripe checkout
      if (result.sessionUrl) {
        console.log('🔄 Redirecting to Stripe checkout for single order:', result.sessionUrl);
        window.location.href = result.sessionUrl;
      } else {
        console.error('❌ Server response missing sessionUrl:', result);
        throw new Error('No session URL received from server');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error creating single order checkout:', error);
      throw error;
    }
  },

  // Retrieve session
  async retrieveSession(sessionId) {
    try {
      const endpoint = await this.getEndpoint('/retrieve-session');
      console.log('🔍 Retrieving session:', sessionId);
      
      const response = await fetch(`${SERVER_PAYMENTS_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Session retrieved:', result);
      return result;
    } catch (error) {
      console.error('❌ Error retrieving session:', error);
      throw error;
    }
  },

  // Create customer portal session
  async createCustomerPortalSession(customerId, returnUrl) {
    try {
      const endpoint = await this.getEndpoint('/create-customer-portal-session');
      console.log('🔍 Creating customer portal session:', customerId);
      
      const response = await fetch(`${SERVER_PAYMENTS_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          return_url: returnUrl || window.location.origin
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Customer portal session created:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating customer portal session:', error);
      throw error;
    }
  },

  // Check subscription status
  async checkSubscriptionStatus(customerId) {
    try {
      const endpoint = await this.getEndpoint('/check-subscription-status');
      console.log('🔍 Checking subscription status:', customerId);
      
      const response = await fetch(`${SERVER_PAYMENTS_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: customerId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subscription status checked:', result);
      return result;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      throw error;
    }
  }
};
