import { loadStripe } from '@stripe/stripe-js';

// Server payments service URL
const SERVER_PAYMENTS_URL = 'https://pay.roamjet.net';

// Stripe instance cache
let stripeInstance = null;
let currentStripeMode = null;

// Get or initialize Stripe with the correct key for current mode
async function getStripeInstance() {
  try {
    // Use environment variables instead of configService to avoid MongoDB connections
    const mode = process.env.NEXT_PUBLIC_STRIPE_MODE || 'test';
    const publishableKey = mode === 'live' 
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
    
    // If mode changed, reinitialize Stripe
    if (mode !== currentStripeMode || !stripeInstance) {
      currentStripeMode = mode;
      
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
      
      // Use direct API instead of Firebase Functions
      const response = await fetch(`${SERVER_PAYMENTS_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          metadata: metadata,
          automatic_payment_methods: {
            enabled: true,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { client_secret } = await response.json();
      console.log('✅ Payment intent created successfully');
      
      return { client_secret };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  },

  // Create checkout session for Stripe Checkout
  async createCheckoutSession(orderData) {
    try {
      console.log('🛒 Creating checkout session:', orderData);
      
      const response = await fetch(`${SERVER_PAYMENTS_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { sessionId, url } = await response.json();
      console.log('✅ Checkout session created:', { sessionId, url });
      
      return { sessionId, url };
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
  },

  // Redirect to Stripe Checkout
  async redirectToCheckout(sessionId) {
    try {
      const stripe = await getStripeInstance();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      console.log('🔄 Redirecting to Stripe Checkout...');
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('❌ Error redirecting to checkout:', error);
      throw error;
    }
  },

  // Process payment with Stripe Elements
  async processPayment(clientSecret, paymentMethod) {
    try {
      const stripe = await getStripeInstance();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      console.log('💳 Processing payment...');
      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        paymentMethod,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
      });

      if (error) {
        throw error;
      }

      console.log('✅ Payment processed successfully:', paymentIntent);
      return paymentIntent;
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      throw error;
    }
  },

  // Get Stripe instance for custom implementations
  async getStripe() {
    return await getStripeInstance();
  }
};
