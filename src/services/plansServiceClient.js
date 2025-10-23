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

// Get countries with pricing (full version with actual pricing calculation)
export const getCountriesWithPricing = async () => {
  try {
    // Get countries and plans from API
    console.log('🌍 Fetching countries from API:', `${API_BASE_URL}/api/public/countries`);
    let countries = [];
    
    try {
      const countriesResponse = await axios.get(`${API_BASE_URL}/api/public/countries`);
      if (countriesResponse.data.success) {
        countries = countriesResponse.data.data.countries.map(country => ({
          ...country,
          flagEmoji: country.flagEmoji || getFlagEmoji(country.code)
        }));
        console.log(`✅ Loaded ${countries.length} countries from API`);
      }
    } catch (apiError) {
      console.error('❌ Error fetching countries from API:', apiError);
      throw apiError;
    }
    
    // Get all plans (already filtered for enabled plans)
    const allPlans = await getAllPlans();
    
    console.log('🔍 All enabled plans loaded for countries:', allPlans.length);
    console.log('🔍 Sample plan data:', allPlans.slice(0, 3).map(p => ({ 
      id: p.id || p._id, 
      name: p.name, 
      price: p.price, 
      country_codes: p.country_codes,
      country_ids: p.country_ids 
    })));
    
    // Calculate minimum price for each country using the same logic as admin dashboard
    const countriesWithPricing = countries.map(country => {
      // Find all plans for this country
      const countryPlans = allPlans.filter(plan => {
        // Check if plan applies to this country by country code
        if (plan.country_codes && Array.isArray(plan.country_codes)) {
          return plan.country_codes.includes(country.code);
        }
        
        // Fallback: check by country ID if available
        if (plan.country_ids && Array.isArray(plan.country_ids) && country.id) {
          return plan.country_ids.includes(country.id);
        }
        
        return false;
      });
      
      // Calculate minimum price from valid plans
      const validPrices = countryPlans
        .map(plan => parseFloat(plan.price))
        .filter(price => !isNaN(price) && price > 0);
      
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 999;
      const plansCount = countryPlans.length;
      
      // Debug logging for first few countries
      if (countries.indexOf(country) < 5) {
        console.log(`🔍 Country ${country.name} (${country.code}):`, {
          plansFound: countryPlans.length,
          validPrices: validPrices.length,
          minPrice: minPrice,
          samplePlans: countryPlans.slice(0, 2).map(p => ({ name: p.name, price: p.price }))
        });
      }
      
      return {
        ...country,
        minPrice,
        plansCount,
        plans: countryPlans // Include plans for detailed view
      };
    });
    
    console.log('🎯 Countries with pricing calculated:', countriesWithPricing.length);
    console.log('🎯 Countries with valid pricing:', countriesWithPricing.filter(c => c.minPrice < 999).length);
    
    return countriesWithPricing;
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
