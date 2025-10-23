import { Settings } from '../database/models';
import connectDB from '../database/config';

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
  
  // Discount Settings
  regular: {
    discountPercentage: parseInt(process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE) || 20,
    minimumPrice: parseFloat(process.env.NEXT_PUBLIC_MINIMUM_PRICE) || 0.5
  },
  
  // Metadata
  updatedBy: null
};

// Get all settings
export const getSettings = async () => {
  try {
    await connectDB();
    
    // Get the most recent settings document
    const settings = await Settings.findOne().sort({ updatedAt: -1 });
    
    if (settings) {
      // Merge with defaults to ensure all fields exist
      const mergedSettings = {
        ...defaultSettings,
        ...settings.toObject(),
        updatedAt: settings.updatedAt,
        createdAt: settings.createdAt
      };
      
      return mergedSettings;
    }
    
    // Return defaults if no settings found
    return {
      ...defaultSettings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

// Get specific setting by path (dot notation)
export const getSetting = async (path) => {
  try {
    const settings = await getSettings();
    
    // Navigate through nested object using dot notation
    return path.split('.').reduce((obj, key) => obj?.[key], settings);
  } catch (error) {
    console.error(`Error getting setting ${path}:`, error);
    return null;
  }
};

// Update settings
export const updateSettings = async (updates, userId = null) => {
  try {
    await connectDB();
    
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
    
    console.log('✅ Settings updated successfully');
    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Update specific setting by path
export const updateSetting = async (path, value, userId = null) => {
  try {
    await connectDB();
    
    // Create update object from dot notation path
    const updateObj = {};
    const keys = path.split('.');
    let current = updateObj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    // Add metadata
    updateObj.updatedBy = userId;
    updateObj.updatedAt = new Date();
    
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updateObj },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    console.log(`✅ Setting ${path} updated successfully`);
    return settings;
  } catch (error) {
    console.error(`Error updating setting ${path}:`, error);
    throw error;
  }
};

// Reset settings to defaults
export const resetSettings = async (userId = null) => {
  try {
    await connectDB();
    
    const settings = await Settings.findOneAndUpdate(
      {},
      { 
        ...defaultSettings,
        updatedBy: userId,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    console.log('✅ Settings reset to defaults');
    return settings;
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
};

// Delete all settings
export const deleteSettings = async () => {
  try {
    await connectDB();
    
    await Settings.deleteMany({});
    console.log('✅ All settings deleted');
    return true;
  } catch (error) {
    console.error('Error deleting settings:', error);
    throw error;
  }
};
