import connectDB from '../database/config';
import { Settings } from '../database/models';

// Default settings structure
const defaultSettings = {
  // Social Media Links
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
  
  // Contact Information
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
  
  // Company Information
  company: {
    name: '',
    description: '',
    founded: '',
    employees: '',
    industry: '',
    logo: ''
  },
  
  // Business Hours
  businessHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  },
  
  // SEO Settings
  seo: {
    title: '',
    description: '',
    keywords: [],
    ogImage: '',
    favicon: ''
  },
  
  // App Settings
  app: {
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    maxFileSize: 10, // MB
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
  },
  
  // App Store Links
  appStore: {
    iosUrl: '',
    androidUrl: ''
  },
  
  // Regular Settings
  regular: {
    discountPercentage: 20,
    minimumPrice: 0.5
  },
  
  // Stripe Configuration
  stripe: {
    publishableKeyTest: '',
    secretKeyTest: '',
    publishableKeyLive: '',
    secretKeyLive: '',
    mode: 'test' // 'test' or 'live'
  }
};

class SettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get settings from MongoDB
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
        const defaultSettingsDoc = await this.createDefaultSettings();
        this.cache.set(cacheKey, {
          data: defaultSettingsDoc,
          timestamp: Date.now()
        });
        return defaultSettingsDoc;
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
      const settingsDoc = {
        name: 'adminSettings',
        ...defaultSettings,
        updatedAt: new Date(),
        updatedBy: 'system'
      };

      const createdSettings = await Settings.create(settingsDoc);
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
        { 
          $set: {
            ...updates,
            updatedAt: new Date(),
            updatedBy: 'admin'
          }
        },
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

  // Update specific section
  async updateSection(section, data) {
    try {
      await connectDB();
      const updateQuery = {};
      updateQuery[section] = data;
      updateQuery.updatedAt = new Date();
      updateQuery.updatedBy = 'admin';

      const updatedSettings = await Settings.findOneAndUpdate(
        { name: 'adminSettings' },
        { $set: updateQuery },
        { new: true, upsert: true }
      );
      
      // Clear cache
      this.cache.delete('adminSettings');
      
      console.log(`✅ ${section} section updated`);
      return updatedSettings;
    } catch (error) {
      console.error(`❌ Error updating ${section} section:`, error);
      throw error;
    }
  }

  // Get specific section
  async getSection(section) {
    try {
      const settings = await this.getSettings();
      return settings[section] || defaultSettings[section];
    } catch (error) {
      console.error(`❌ Error getting ${section} section:`, error);
      return defaultSettings[section];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Settings cache cleared');
  }
}

// Create singleton instance
const settingsService = new SettingsService();

export default settingsService;