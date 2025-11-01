// Client-safe settings service - uses API calls instead of direct MongoDB access

// Default settings structure
const defaultSettings = {
  regular: {
    discountPercentage: 0,
    minimumPrice: 0.5
  }
};

// Cache for settings
let settingsCache = null;
let settingsCacheTimestamp = null;
const SETTINGS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get regular settings (client-safe version, loads from MongoDB config)
export const getRegularSettings = async () => {
  // Return cached if valid
  if (settingsCache && settingsCacheTimestamp && (Date.now() - settingsCacheTimestamp < SETTINGS_CACHE_DURATION)) {
    console.log('📋 Using cached regular settings');
    return settingsCache;
  }

  try {
    const response = await fetch('/api/config/get');
    const data = await response.json();
    
    if (data.success && data.config) {
      const settings = {
        discountPercentage: data.config.discountPercentage || 0,
        minimumPrice: defaultSettings.regular.minimumPrice
      };
      
      settingsCache = settings;
      settingsCacheTimestamp = Date.now();
      
      console.log('📋 Regular settings loaded from MongoDB:', settings);
      return settings;
    } else {
      console.log('📋 Using default regular settings (no config found)');
      return defaultSettings.regular;
    }
  } catch (error) {
    console.error('❌ Error getting regular settings:', error);
    return defaultSettings.regular;
  }
};

export default {
  getRegularSettings
};

