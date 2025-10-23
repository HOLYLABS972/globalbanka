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
    // Try to get from API first
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
    const response = await fetch(`${API_BASE_URL}/api/public/settings/regular`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.data.regular;
      }
    }
    
    // Fallback to default settings
    console.log('Using default regular settings');
    return defaultSettings.regular;
  } catch (error) {
    console.error('❌ Error getting regular settings:', error);
    return defaultSettings.regular;
  }
};

export default {
  getRegularSettings
};
