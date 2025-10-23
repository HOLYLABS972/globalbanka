import connectDB from '../database/config';
import { DataPlan, Country } from '../database/models';
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
    
    // Fallback to MongoDB if API fails
    console.log('⚠️ Falling back to MongoDB access...');
    try {
      await connectDB();
      const plans = await DataPlan.find({ enabled: true });
      console.log(`✅ Loaded ${plans.length} plans from MongoDB`);
      return plans;
    } catch (dbError) {
      console.error('❌ Error getting plans from MongoDB:', dbError);
      throw new Error('Failed to fetch plans from both API and database');
    }
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
    
    // Fallback to MongoDB if API fails
    console.log('⚠️ Falling back to MongoDB access...');
    try {
      await connectDB();
      const countries = await Country.find({ isActive: true });
      console.log(`✅ Loaded ${countries.length} countries from MongoDB`);
      return countries;
    } catch (dbError) {
      console.error('❌ Error getting countries from MongoDB:', dbError);
      throw new Error('Failed to fetch countries from both API and database');
    }
  }
};

// Get plans by country code
export const getPlansByCountry = async (countryCode) => {
  try {
    const allPlans = await getAllPlans();
    const countryPlans = allPlans.filter(plan => 
      plan.country_codes && plan.country_codes.includes(countryCode)
    );
    
    console.log(`📦 Found ${countryPlans.length} plans for country: ${countryCode}`);
    return countryPlans;
  } catch (error) {
    console.error('❌ Error getting plans by country:', error);
    throw error;
  }
};

// Get country by code
export const getCountryByCode = async (countryCode) => {
  try {
    const allCountries = await getAllCountries();
    const country = allCountries.find(c => c.code === countryCode);
    
    if (country) {
      console.log(`🌍 Found country: ${country.name} (${country.code})`);
    } else {
      console.log(`❌ Country not found: ${countryCode}`);
    }
    
    return country;
  } catch (error) {
    console.error('❌ Error getting country by code:', error);
    throw error;
  }
};

// Get plans with country information
export const getPlansWithCountries = async () => {
  try {
    const [plans, countries] = await Promise.all([
      getAllPlans(),
      getAllCountries()
    ]);
    
    // Create a map of countries for quick lookup
    const countryMap = {};
    countries.forEach(country => {
      countryMap[country.code] = {
        ...country,
        flagEmoji: getFlagEmoji(country.code)
      };
    });
    
    // Add country information to plans
    const plansWithCountries = plans.map(plan => ({
      ...plan,
      countries: plan.country_codes ? plan.country_codes.map(code => countryMap[code]).filter(Boolean) : []
    }));
    
    console.log(`✅ Loaded ${plansWithCountries.length} plans with country information`);
    return plansWithCountries;
  } catch (error) {
    console.error('❌ Error getting plans with countries:', error);
    throw error;
  }
};

// Search plans by name or description
export const searchPlans = async (query) => {
  try {
    const allPlans = await getAllPlans();
    const searchTerm = query.toLowerCase();
    
    const filteredPlans = allPlans.filter(plan => 
      plan.name.toLowerCase().includes(searchTerm) ||
      (plan.description && plan.description.toLowerCase().includes(searchTerm))
    );
    
    console.log(`🔍 Found ${filteredPlans.length} plans matching: ${query}`);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error searching plans:', error);
    throw error;
  }
};

// Get plans by price range
export const getPlansByPriceRange = async (minPrice, maxPrice) => {
  try {
    const allPlans = await getAllPlans();
    const filteredPlans = allPlans.filter(plan => 
      plan.price >= minPrice && plan.price <= maxPrice
    );
    
    console.log(`💰 Found ${filteredPlans.length} plans in price range: $${minPrice} - $${maxPrice}`);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error getting plans by price range:', error);
    throw error;
  }
};

// Get plans by data amount
export const getPlansByDataAmount = async (dataAmount) => {
  try {
    const allPlans = await getAllPlans();
    const filteredPlans = allPlans.filter(plan => 
      plan.dataAmount && plan.dataAmount.toLowerCase().includes(dataAmount.toLowerCase())
    );
    
    console.log(`📊 Found ${filteredPlans.length} plans with data amount: ${dataAmount}`);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error getting plans by data amount:', error);
    throw error;
  }
};

// Get plans by validity period
export const getPlansByValidity = async (validity) => {
  try {
    const allPlans = await getAllPlans();
    const filteredPlans = allPlans.filter(plan => 
      plan.validity && plan.validity.toLowerCase().includes(validity.toLowerCase())
    );
    
    console.log(`⏰ Found ${filteredPlans.length} plans with validity: ${validity}`);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error getting plans by validity:', error);
    throw error;
  }
};

// Get plans by provider
export const getPlansByProvider = async (provider) => {
  try {
    const allPlans = await getAllPlans();
    const filteredPlans = allPlans.filter(plan => 
      plan.provider && plan.provider.toLowerCase().includes(provider.toLowerCase())
    );
    
    console.log(`🏢 Found ${filteredPlans.length} plans from provider: ${provider}`);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error getting plans by provider:', error);
    throw error;
  }
};

// Get plans by continent
export const getPlansByContinent = async (continent) => {
  try {
    const allPlans = await getAllPlans();
    const filteredPlans = allPlans.filter(plan => 
      plan.countries && plan.countries.some(country => 
        country.continent && country.continent.toLowerCase().includes(continent.toLowerCase())
      )
    );
    
    console.log(`🌍 Found ${filteredPlans.length} plans for continent: ${continent}`);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error getting plans by continent:', error);
    throw error;
  }
};

// Get plans by region
export const getPlansByRegion = async (region) => {
  try {
    const allPlans = await getAllPlans();
    const filteredPlans = allPlans.filter(plan => 
      plan.countries && plan.countries.some(country => 
        country.region && country.region.toLowerCase().includes(region.toLowerCase())
      )
    );
    
    console.log(`🗺️ Found ${filteredPlans.length} plans for region: ${region}`);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error getting plans by region:', error);
    throw error;
  }
};

// Get plans by multiple filters
export const getPlansByFilters = async (filters) => {
  try {
    const allPlans = await getAllPlans();
    let filteredPlans = allPlans;
    
    // Apply filters
    if (filters.countryCode) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.country_codes && plan.country_codes.includes(filters.countryCode)
      );
    }
    
    if (filters.minPrice !== undefined) {
      filteredPlans = filteredPlans.filter(plan => plan.price >= filters.minPrice);
    }
    
    if (filters.maxPrice !== undefined) {
      filteredPlans = filteredPlans.filter(plan => plan.price <= filters.maxPrice);
    }
    
    if (filters.dataAmount) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.dataAmount && plan.dataAmount.toLowerCase().includes(filters.dataAmount.toLowerCase())
      );
    }
    
    if (filters.validity) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.validity && plan.validity.toLowerCase().includes(filters.validity.toLowerCase())
      );
    }
    
    if (filters.provider) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.provider && plan.provider.toLowerCase().includes(filters.provider.toLowerCase())
      );
    }
    
    console.log(`🔍 Found ${filteredPlans.length} plans matching filters:`, filters);
    return filteredPlans;
  } catch (error) {
    console.error('❌ Error getting plans by filters:', error);
    throw error;
  }
};

// Get plans statistics
export const getPlansStats = async () => {
  try {
    const allPlans = await getAllPlans();
    const allCountries = await getAllCountries();
    
    const stats = {
      totalPlans: allPlans.length,
      totalCountries: allCountries.length,
      averagePrice: allPlans.reduce((sum, plan) => sum + plan.price, 0) / allPlans.length,
      minPrice: Math.min(...allPlans.map(plan => plan.price)),
      maxPrice: Math.max(...allPlans.map(plan => plan.price)),
      providers: [...new Set(allPlans.map(plan => plan.provider))],
      continents: [...new Set(allCountries.map(country => country.continent))],
      regions: [...new Set(allCountries.map(country => country.region))]
    };
    
    console.log('📊 Plans statistics:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting plans statistics:', error);
    throw error;
  }
};

// Export all functions
export default {
  getAllPlans,
  getAllCountries,
  getPlansByCountry,
  getCountryByCode,
  getPlansWithCountries,
  searchPlans,
  getPlansByPriceRange,
  getPlansByDataAmount,
  getPlansByValidity,
  getPlansByProvider,
  getPlansByContinent,
  getPlansByRegion,
  getPlansByFilters,
  getPlansStats
};