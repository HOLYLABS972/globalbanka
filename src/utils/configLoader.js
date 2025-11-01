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
    const roamjetMode = dbConfig?.roamjetMode || 'sandbox';
    const config = {
      googleId: dbConfig?.googleId || process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      googleSecret: dbConfig?.googleSecret || process.env.GOOGLE_CLIENT_SECRET,
      googleAuthEnabled: dbConfig?.googleAuthEnabled ?? false,
      yandexAppId: dbConfig?.yandexAppId || process.env.YANDEX_APP_ID || process.env.NEXT_PUBLIC_YANDEX_APP_ID,
      yandexAppSecret: dbConfig?.yandexAppSecret || process.env.YANDEX_APP_SECRET,
      yandexAuthEnabled: dbConfig?.yandexAuthEnabled ?? false,
      roamjetApiKey: dbConfig?.roamjetApiKey || process.env.ROAMJET_API_KEY || process.env.NEXT_PUBLIC_ROAMJET_API_KEY,
      roamjetMode,
      roamjetApiUrl: roamjetMode === 'production' ? 'https://api.roamjet.net' : 'https://sandbox.roamjet.net',
      robokassaMerchantLogin: dbConfig?.robokassaMerchantLogin || process.env.ROBOKASSA_MERCHANT_LOGIN || process.env.NEXT_PUBLIC_ROBOKASSA_MERCHANT_LOGIN,
      robokassaPassOne: dbConfig?.robokassaPassOne || process.env.ROBOKASSA_PASS_ONE || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_ONE,
      robokassaPassTwo: dbConfig?.robokassaPassTwo || process.env.ROBOKASSA_PASS_TWO || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_TWO,
      robokassaMode: dbConfig?.robokassaMode || process.env.ROBOKASSA_MODE || 'test',
      discountPercentage: dbConfig?.discountPercentage || 0,
      usdToRubRate: dbConfig?.usdToRubRate || 100
    };
    
    // Update cache
    configCache = config;
    cacheTimestamp = Date.now();
    
    return config;
  } catch (error) {
    console.error('❌ Error loading admin config, falling back to ENV:', error);
    
    // Fallback to ENV vars only
    const roamjetMode = 'sandbox';
    const envConfig = {
      googleId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      googleSecret: process.env.GOOGLE_CLIENT_SECRET,
      googleAuthEnabled: false,
      yandexAppId: process.env.YANDEX_APP_ID || process.env.NEXT_PUBLIC_YANDEX_APP_ID,
      yandexAppSecret: process.env.YANDEX_APP_SECRET,
      yandexAuthEnabled: false,
      roamjetApiKey: process.env.ROAMJET_API_KEY || process.env.NEXT_PUBLIC_ROAMJET_API_KEY,
      roamjetMode,
      roamjetApiUrl: roamjetMode === 'production' ? 'https://api.roamjet.net' : 'https://sandbox.roamjet.net',
      robokassaMerchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || process.env.NEXT_PUBLIC_ROBOKASSA_MERCHANT_LOGIN,
      robokassaPassOne: process.env.ROBOKASSA_PASS_ONE || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_ONE,
      robokassaPassTwo: process.env.ROBOKASSA_PASS_TWO || process.env.NEXT_PUBLIC_ROBOKASSA_PASS_TWO,
      robokassaMode: process.env.ROBOKASSA_MODE || 'test',
      discountPercentage: 0,
      usdToRubRate: 100
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

