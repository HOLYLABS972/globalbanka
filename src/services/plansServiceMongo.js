import { DataPlan, Country } from '../database/models';
import connectDB from '../database/config';
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
      const plans = await DataPlan.find({ enabled: { $ne: false } });
      console.log(`✅ Loaded ${plans.length} plans from MongoDB (fallback)`);
      return plans;
    } catch (mongodbError) {
      console.error('❌ MongoDB fallback also failed:', mongodbError);
      throw error;
    }
  }
};

// Get plans count
export const getPlansCount = async () => {
  try {
    await connectDB();
    const count = await DataPlan.countDocuments({ enabled: { $ne: false } });
    return count;
  } catch (error) {
    console.error('Error getting plans count:', error);
    return 0;
  }
};

// Get countries with real pricing from API (same logic as admin dashboard)
export const getCountriesWithPricing = async () => {
  try {
    // Get countries from API
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
      console.log('⚠️ Falling back to MongoDB access for countries...');
      
      // Fallback to MongoDB
      await connectDB();
      const mongoCountries = await Country.find({ isActive: { $ne: false } });
      countries = mongoCountries.map(country => ({
        id: country._id,
        ...country.toObject(),
        flagEmoji: country.flagEmoji || getFlagEmoji(country.code)
      }));
      console.log(`✅ Loaded ${countries.length} countries from MongoDB (fallback)`);
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
      // Find plans for this country using the same logic as admin dashboard
      const countryPlans = allPlans.filter(plan => {
        // Check if plan has country_codes array and includes this country's code
        if (plan.country_codes && Array.isArray(plan.country_codes)) {
          return plan.country_codes.includes(country.code);
        }
        // Check if plan has country_ids array and includes this country's code
        if (plan.country_ids && Array.isArray(plan.country_ids)) {
          return plan.country_ids.includes(country.code);
        }
        // Check if plan has country field matching country name
        if (plan.country) {
          return plan.country === country.name;
        }
        return false;
      });
      
      // Calculate minimum price
      const minPrice = countryPlans.length > 0 
        ? Math.min(...countryPlans.map(plan => parseFloat(plan.price) || 999))
        : 999;
      
      return {
        ...country,
        minPrice: minPrice,
        plansCount: countryPlans.length,
        plans: countryPlans // Include the actual plans for filtering
      };
    });
    
    console.log('✅ Countries with pricing calculated:', countriesWithPricing.length);
    return countriesWithPricing;
  } catch (error) {
    console.error('Error getting countries with pricing:', error);
    throw error;
  }
};

// Get pricing statistics (only enabled plans)
export const getPricingStats = async () => {
  try {
    const allPlans = await getAllPlans(); // Already filtered for enabled plans
    
    if (allPlans.length === 0) {
      return {
        totalPlans: 0,
        totalCountries: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0
      };
    }
    
    const prices = allPlans.map(plan => parseFloat(plan.price) || 0).filter(price => price > 0);
    const countries = new Set();
    
    allPlans.forEach(plan => {
      if (plan.country_codes) {
        plan.country_codes.forEach(code => countries.add(code));
      }
      if (plan.country_ids) {
        plan.country_ids.forEach(id => countries.add(id));
      }
      if (plan.country) {
        countries.add(plan.country);
      }
    });
    
    return {
      totalPlans: allPlans.length,
      totalCountries: countries.size,
      averagePrice: prices.length > 0 ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices).toFixed(2) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting pricing stats:', error);
    throw error;
  }
};
