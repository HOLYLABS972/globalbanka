// Configuration service to read admin settings - MongoDB version
import { BusinessUser, Settings } from '../database/models';
import connectDB from '../database/config';

class ConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get Stripe mode (test/live) from admin configuration
  async getStripeMode() {
    // HARDCODED TO SANDBOX/TEST MODE
    console.log('🧪 HARDCODED: Always using TEST/SANDBOX mode');
    return 'sandbox';
  }

  // Get Stripe publishable key for the given mode
  async getStripePublishableKey(mode) {
    try {
      await connectDB();
      
      // Check cache first
      const cacheKey = `stripe_publishable_${mode}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`🔑 Using cached Stripe publishable key for ${mode} mode`);
        return cached.value;
      }

      console.log(`🔍 Getting Stripe publishable key for ${mode} mode...`);
      
      // Get current user's business profile
      const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
      
      if (roamjetApiKey) {
        // Find business user by API key
        const businessUser = await BusinessUser.findOne({
          'apiCredentials.apiKey': roamjetApiKey
        });
        
        if (businessUser && businessUser.stripeCredentials) {
          const publishableKey = businessUser.stripeCredentials.publishableKey?.[mode];
          if (publishableKey) {
            console.log(`🔑 Found Stripe publishable key for ${mode} mode`);
            // Cache the result
            this.cache.set(cacheKey, {
              value: publishableKey,
              timestamp: Date.now()
            });
            return publishableKey;
          }
        }
      }
      
      // Fallback to environment variables
      const envKey = mode === 'test' || mode === 'sandbox' 
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
        : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE;
      
      if (envKey) {
        console.log(`🔑 Using Stripe publishable key from environment for ${mode} mode`);
        // Cache the result
        this.cache.set(cacheKey, {
          value: envKey,
          timestamp: Date.now()
        });
        return envKey;
      }
      
      console.warn(`⚠️ No Stripe publishable key found for ${mode} mode`);
      return null;
    } catch (error) {
      console.error('❌ Error getting Stripe publishable key:', error);
      return null;
    }
  }

  // Get Stripe secret key for the given mode
  async getStripeSecretKey(mode) {
    try {
      await connectDB();
      
      // Check cache first
      const cacheKey = `stripe_secret_${mode}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`🔑 Using cached Stripe secret key for ${mode} mode`);
        return cached.value;
      }

      console.log(`🔍 Getting Stripe secret key for ${mode} mode...`);
      
      // Get current user's business profile
      const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
      
      if (roamjetApiKey) {
        // Find business user by API key
        const businessUser = await BusinessUser.findOne({
          'apiCredentials.apiKey': roamjetApiKey
        });
        
        if (businessUser && businessUser.stripeCredentials) {
          const secretKey = businessUser.stripeCredentials.secretKey?.[mode];
          if (secretKey) {
            console.log(`🔑 Found Stripe secret key for ${mode} mode`);
            // Cache the result
            this.cache.set(cacheKey, {
              value: secretKey,
              timestamp: Date.now()
            });
            return secretKey;
          }
        }
      }
      
      // Fallback to environment variables
      const envKey = mode === 'test' || mode === 'sandbox' 
        ? process.env.STRIPE_SECRET_KEY_TEST
        : process.env.STRIPE_SECRET_KEY_LIVE;
      
      if (envKey) {
        console.log(`🔑 Using Stripe secret key from environment for ${mode} mode`);
        // Cache the result
        this.cache.set(cacheKey, {
          value: envKey,
          timestamp: Date.now()
        });
        return envKey;
      }
      
      console.warn(`⚠️ No Stripe secret key found for ${mode} mode`);
      return null;
    } catch (error) {
      console.error('❌ Error getting Stripe secret key:', error);
      return null;
    }
  }

  // Get all admin settings
  async getAdminSettings() {
    try {
      await connectDB();
      
      // Check cache first
      const cacheKey = 'admin_settings';
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('🔍 Using cached admin settings');
        return cached.value;
      }

      console.log('🔍 Getting admin settings from MongoDB...');
      
      // Get settings document (assuming single settings document)
      const settings = await Settings.findOne().sort({ updatedAt: -1 });
      
      if (settings) {
        console.log('✅ Admin settings loaded from MongoDB');
        // Cache the result
        this.cache.set(cacheKey, {
          value: settings,
          timestamp: Date.now()
        });
        return settings;
      }
      
      console.log('⚠️ No admin settings found, using defaults');
      return null;
    } catch (error) {
      console.error('❌ Error getting admin settings:', error);
      return null;
    }
  }

  // Get specific setting value
  async getSetting(path) {
    try {
      const settings = await this.getAdminSettings();
      if (!settings) return null;
      
      // Navigate through nested object using dot notation
      return path.split('.').reduce((obj, key) => obj?.[key], settings);
    } catch (error) {
      console.error('❌ Error getting setting:', error);
      return null;
    }
  }

  // Update admin settings
  async updateAdminSettings(updates, userId) {
    try {
      await connectDB();
      
      console.log('🔍 Updating admin settings in MongoDB...');
      
      // Update or create settings document
      const settings = await Settings.findOneAndUpdate(
        {},
        { 
          ...updates,
          updatedBy: userId,
          updatedAt: new Date()
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true 
        }
      );
      
      // Clear cache
      this.cache.delete('admin_settings');
      
      console.log('✅ Admin settings updated in MongoDB');
      return settings;
    } catch (error) {
      console.error('❌ Error updating admin settings:', error);
      throw error;
    }
  }

  // Detect API key mode from API key
  detectApiKeyMode(apiKey) {
    if (!apiKey) return 'sandbox';
    
    // Check if API key contains test/sandbox indicators
    const testIndicators = ['test', 'sandbox', 'dev', 'staging'];
    const lowerApiKey = apiKey.toLowerCase();
    
    for (const indicator of testIndicators) {
      if (lowerApiKey.includes(indicator)) {
        return 'sandbox';
      }
    }
    
    // Default to sandbox for safety
    return 'sandbox';
  }

  // Get current API key mode from business_users collection (RoamJet API key)
  async getApiKeyMode() {
    try {
      console.log('🔍 getApiKeyMode called');
      
      // Check if we have a RoamJet API key from environment
      const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
      console.log('🔑 RoamJet API Key from env:', roamjetApiKey ? `${roamjetApiKey.substring(0, 15)}...` : 'Not set');
      
      // If we have an API key, try to find the user by API key directly
      if (roamjetApiKey) {
        console.log('🔍 Searching for user by API key...');
        
        await connectDB();
        const businessUser = await BusinessUser.findOne({
          'apiCredentials.apiKey': roamjetApiKey
        });
        
        if (businessUser) {
          console.log('👤 Found user by API key:', {
            id: businessUser._id,
            companyName: businessUser.companyName,
            apiCredentials: businessUser.apiCredentials
          });
          
          const apiMode = businessUser.apiCredentials?.mode || 'sandbox';
          console.log('🔍 RoamJet API key mode detected:', apiMode);
          return apiMode;
        } else {
          console.log('❌ No user found with this API key');
        }
      }
      
      // Fallback: detect mode from API key
      if (roamjetApiKey) {
        const detectedMode = this.detectApiKeyMode(roamjetApiKey);
        console.log('🔍 Detected API key mode:', detectedMode);
        return detectedMode;
      }
      
      console.log('⚠️ No API key found, defaulting to sandbox');
      return 'sandbox';
    } catch (error) {
      console.error('❌ Error getting API key mode:', error);
      return 'sandbox';
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Config cache cleared');
  }
}

// Create singleton instance
const configService = new ConfigService();

export default configService;
