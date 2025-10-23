// Client-safe plans service - uses API calls instead of direct MongoDB access
import axios from 'axios';

// API base URL - use environment variable or default to production URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  // Handle special cases like PT-MA, multi-region codes, etc.
  if (countryCode.includes('-') || countryCode.length > 2) {
    return '🌍';
  }
  
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    console.warn('Invalid country code: ' + countryCode, error);
    return '🌍';
  }
};

// Get all plans from API (only enabled plans)
export const getAllPlans = async () => {
  try {
    console.log('📦 Fetching plans from API:', `${API_BASE_URL}/api/public/plans`);
    const response = await axios.get(`${API_BASE_URL}/api/public/plans`);
    
    if (response.data.success) {
      const plans = response.data.data.plans;
      console.log(`✅ Loaded ${plans.length} plans from API`);
      return plans;
    } else {
      throw new Error('Failed to fetch plans from API');
    }
  } catch (error) {
    console.error('❌ Error getting plans from API:', error);
    throw error;
  }
};

// Get all countries from API
export const getAllCountries = async () => {
  try {
    console.log('🌍 Fetching countries from API:', `${API_BASE_URL}/api/public/countries`);
    const response = await axios.get(`${API_BASE_URL}/api/public/countries`);
    
    if (response.data.success) {
      const countries = response.data.data.countries;
      console.log(`✅ Loaded ${countries.length} countries from API`);
      return countries;
    } else {
      throw new Error('Failed to fetch countries from API');
    }
  } catch (error) {
    console.error('❌ Error getting countries from API:', error);
    throw error;
  }
};

// Get countries with pricing (simplified version for compatibility)
export const getCountriesWithPricing = async () => {
  try {
    const countries = await getAllCountries();
    return countries.map(country => ({
      ...country,
      flagEmoji: getFlagEmoji(country.code)
    }));
  } catch (error) {
    console.error('❌ Error getting countries with pricing:', error);
    throw error;
  }
};

// Export all functions
export default {
  getAllPlans,
  getAllCountries,
  getCountriesWithPricing
};
