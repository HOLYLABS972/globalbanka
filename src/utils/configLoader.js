import connectDB from '../database/config';
import { AdminConfig } from '../database/models';

let configCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load admin configuration from MongoDB, falling back to environment variables
 * Results are cached for 5 minutes to reduce database queries
 */
export async function loadAdminConfig() {
  // Return cached config if still valid
  if (configCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return configCache;
  }

  try {
    await connectDB();
    const dbConfig = await AdminConfig.findOne();
    
    // Use MongoDB config only, no ENV fallback
    const roamjetMode = dbConfig?.roamjetMode || 'sandbox';
    const config = {
      googleId: dbConfig?.googleId || '',
      googleSecret: dbConfig?.googleSecret || '',
      googleAuthEnabled: dbConfig?.googleAuthEnabled ?? false,
      yandexAppId: dbConfig?.yandexAppId || '',
      yandexAppSecret: dbConfig?.yandexAppSecret || '',
      yandexAuthEnabled: dbConfig?.yandexAuthEnabled ?? false,
      roamjetApiKey: dbConfig?.roamjetApiKey || '',
      roamjetMode,
      roamjetApiUrl: roamjetMode === 'production' ? 'https://api.roamjet.net' : 'https://sandbox.roamjet.net',
      robokassaMerchantLogin: dbConfig?.robokassaMerchantLogin || '',
      robokassaPassOne: dbConfig?.robokassaPassOne || '',
      robokassaPassTwo: dbConfig?.robokassaPassTwo || '',
      robokassaMode: dbConfig?.robokassaMode || 'test',
      discountPercentage: dbConfig?.discountPercentage || 0,
      usdToRubRate: dbConfig?.usdToRubRate || 100
    };
    
    // Update cache
    configCache = config;
    cacheTimestamp = Date.now();
    
    return config;
  } catch (error) {
    console.error('❌ Error loading admin config:', error);
    
    // Return minimal defaults on error, no ENV fallback
    const roamjetMode = 'sandbox';
    const defaultConfig = {
      googleId: '',
      googleSecret: '',
      googleAuthEnabled: false,
      yandexAppId: '',
      yandexAppSecret: '',
      yandexAuthEnabled: false,
      roamjetApiKey: '',
      roamjetMode,
      roamjetApiUrl: roamjetMode === 'production' ? 'https://api.roamjet.net' : 'https://sandbox.roamjet.net',
      robokassaMerchantLogin: '',
      robokassaPassOne: '',
      robokassaPassTwo: '',
      robokassaMode: 'test',
      discountPercentage: 0,
      usdToRubRate: 100
    };
    
    configCache = defaultConfig;
    cacheTimestamp = Date.now();
    
    return defaultConfig;
  }
}

/**
 * Clear the config cache (useful after updating config)
 */
export function clearConfigCache() {
  configCache = null;
  cacheTimestamp = null;
}

