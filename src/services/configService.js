// Configuration service to read admin settings from MongoDB
import connectDB from '../database/config';
import { Settings } from '../database/models';

class ConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.listeners = new Map(); // Track active listeners
  }

  // Get Stripe mode (test/live) from admin configuration
  async getStripeMode() {
    // HARDCODED TO SANDBOX/TEST MODE
    console.log('SANDBOX');
    return 'test';
    

  }

  // Get API key mode (sandbox/live) from admin configuration
  async getApiKeyMode() {
    // HARDCODED TO SANDBOX MODE
    console.log('SANDBOX');
    return 'sandbox';
    
 
  }

  // Get settings from MongoDB with caching
  async getSettings() {
    const cacheKey = 'adminSettings';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📋 Using cached settings');
      return cached.data;
    }

    try {
      await connectDB();
      const settings = await Settings.findOne({ name: 'adminSettings' });
      
      if (settings) {
        console.log('📋 Settings loaded from MongoDB');
        this.cache.set(cacheKey, {
          data: settings,
          timestamp: Date.now()
        });
        return settings;
      } else {
        console.log('📋 No settings found, creating default');
        const defaultSettings = await this.createDefaultSettings();
        this.cache.set(cacheKey, {
          data: defaultSettings,
          timestamp: Date.now()
        });
        return defaultSettings;
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      throw error;
    }
  }

  // Create default settings
  async createDefaultSettings() {
    try {
      await connectDB();
      const defaultSettings = {
        name: 'adminSettings',
        socialMedia: {
          linkedin: '',
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          tiktok: '',
          telegram: '',
          whatsapp: ''
        },
        contact: {
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          website: ''
        },
        company: {
          name: '',
          description: '',
          founded: '',
          employees: '',
          industry: '',
          logo: ''
        },
        businessHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true }
        },
        seo: {
          title: '',
          description: '',
          keywords: [],
          ogImage: '',
          favicon: ''
        },
        app: {
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: false,
          maxFileSize: 10,
          supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
        },
        appStore: {
          iosUrl: '',
          androidUrl: ''
        },
        regular: {
          discountPercentage: 20,
          minimumPrice: 0.5
        },
        robokassa: {
          merchantLogin: '',
          passOne: '',
          passTwo: '',
          mode: 'test'
        }
      };

      const createdSettings = await Settings.create(defaultSettings);
      console.log('✅ Default settings created');
      return createdSettings;
    } catch (error) {
      console.error('❌ Error creating default settings:', error);
      throw error;
    }
  }

  // Update settings
  async updateSettings(updates) {
    try {
      await connectDB();
      const updatedSettings = await Settings.findOneAndUpdate(
        { name: 'adminSettings' },
        { $set: updates },
        { new: true, upsert: true }
      );
      
      // Clear cache
      this.cache.delete('adminSettings');
      
      console.log('✅ Settings updated');
      return updatedSettings;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }

  // Listen to settings changes (simplified version)
  listenToConfigChanges() {
    console.log('🔄 Config service listeners initialized for real-time updates');
    // In a real-time implementation, you could use MongoDB change streams
    // For now, we'll rely on cache invalidation
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Config cache cleared');
  }
}

// Create singleton instance
const configService = new ConfigService();

export { configService };
export default configService;