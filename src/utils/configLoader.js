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
    
    // Merge DB config with env vars, DB takes priority
    const config = {
      googleId: dbConfig?.googleId || process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      yandexAppId: dbConfig?.yandexAppId || process.env.YANDEX_APP_ID || process.env.NEXT_PUBLIC_YANDEX_APP_ID,
      yandexAppSecret: dbConfig?.yandexAppSecret || process.env.YANDEX_APP_SECRET,
      roamjetApiKey: dbConfig?.roamjetApiKey || process.env.ROAMJET_API_KEY || process.env.NEXT_PUBLIC_ROAMJET_API_KEY,
      roamjetApiUrl: process.env.NODE_ENV === 'production' ? 'https://api.roamjet.net' : 'https://sandbox.roamjet.net',
      robokassaMerchantLogin: dbConfig?.robokassaMerchantLogin || process.env.ROBOKASSA_MERCHANT_LOGIN || process.env.NEXT_PUBLIC_ROBOKASSA_MERCHANT_LOGIN,
      robokassaPassOne: dbConfig?.robokassaPassOne || process.env.ROBOKASSA_PASS_ONE || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_ONE,
      robokassaPassTwo: dbConfig?.robokassaPassTwo || process.env.ROBOKASSA_PASS_TWO || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_TWO,
      robokassaMode: dbConfig?.robokassaMode || process.env.ROBOKASSA_MODE || 'test'
    };
    
    // Update cache
    configCache = config;
    cacheTimestamp = Date.now();
    
    return config;
  } catch (error) {
    console.error('❌ Error loading admin config, falling back to ENV:', error);
    
    // Fallback to ENV vars only
    const envConfig = {
      googleId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      yandexAppId: process.env.YANDEX_APP_ID || process.env.NEXT_PUBLIC_YANDEX_APP_ID,
      yandexAppSecret: process.env.YANDEX_APP_SECRET,
      roamjetApiKey: process.env.ROAMJET_API_KEY || process.env.NEXT_PUBLIC_ROAMJET_API_KEY,
      roamjetApiUrl: process.env.NODE_ENV === 'production' ? 'https://api.roamjet.net' : 'https://sandbox.roamjet.net',
      robokassaMerchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || process.env.NEXT_PUBLIC_ROBOKASSA_MERCHANT_LOGIN,
      robokassaPassOne: process.env.ROBOKASSA_PASS_ONE || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_ONE,
      robokassaPassTwo: process.env.ROBOKASSA_PASS_TWO || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_TWO,
      robokassaMode: process.env.ROBOKASSA_MODE || 'test'
    };
    
    configCache = envConfig;
    cacheTimestamp = Date.now();
    
    return envConfig;
  }
}

/**
 * Clear the config cache (useful after updating config)
 */
export function clearConfigCache() {
  configCache = null;
  cacheTimestamp = null;
}

