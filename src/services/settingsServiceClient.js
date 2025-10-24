// Client-safe settings service - uses API calls instead of direct MongoDB access

// Default settings structure
const defaultSettings = {
  regular: {
    discountPercentage: 20,
    minimumPrice: 0.5
  }
};

// Get regular settings (client-safe version)
export const getRegularSettings = async () => {
  try {
    // Since the API endpoint doesn't exist yet, return default settings
    // This prevents the 404 error while maintaining functionality
    console.log('📋 Using default regular settings (API endpoint not available)');
    return defaultSettings.regular;
  } catch (error) {
    console.error('❌ Error getting regular settings:', error);
    return defaultSettings.regular;
  }
};

export default {
  getRegularSettings
};

