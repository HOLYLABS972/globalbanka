/**
 * Currency conversion service for displaying prices in different currencies
 * Supports USD to RUB conversion for Russian language users
 * Exchange rates are loaded from MongoDB via API
 */

// Exchange rates cache (will be loaded from MongoDB via API)
let EXCHANGE_RATES = {
  USD_TO_RUB: 95, // Default fallback
  RUB_TO_USD: 1/95
};

// Cache for config
let configCache = null;
let configCacheTimestamp = null;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load exchange rates from MongoDB config via API
async function loadExchangeRates() {
  // Return cached if valid
  if (configCache && configCacheTimestamp && (Date.now() - configCacheTimestamp < CONFIG_CACHE_DURATION)) {
    return configCache;
  }

  try {
    const response = await fetch('/api/config/get');
    const data = await response.json();
    
    if (data.success && data.config) {
      const usdToRubRate = data.config.usdToRubRate || 95;
      
      EXCHANGE_RATES = {
        USD_TO_RUB: usdToRubRate,
        RUB_TO_USD: 1 / usdToRubRate
      };
      
      configCache = data.config;
      configCacheTimestamp = Date.now();
      
      console.log('💱 Exchange rates loaded from config:', EXCHANGE_RATES);
      
      return data.config;
    } else {
      console.error('❌ Failed to load config from API');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading exchange rates from config:', error);
    return null;
  }
}

// Currency symbols and formatting
const CURRENCY_CONFIG = {
  USD: {
    symbol: '$',
    code: 'USD',
    name: 'US Dollar',
    position: 'before' // $10.50
  },
  RUB: {
    symbol: '₽',
    code: 'RUB', 
    name: 'Russian Ruble',
    position: 'after' // 950₽
  }
};

/**
 * Get the appropriate currency based on user's language/locale
 * @param {string} locale - User's language locale (e.g., 'ru', 'en')
 * @returns {string} Currency code ('USD' or 'RUB')
 */
export const getCurrencyForLocale = (locale) => {
  switch (locale) {
    case 'ru':
      return 'RUB';
    default:
      return 'USD';
  }
};

/**
 * Initialize exchange rates from MongoDB (call this on app startup)
 */
export const initializeExchangeRates = async () => {
  try {
    await loadExchangeRates();
  } catch (error) {
    console.error('❌ Error initializing exchange rates:', error);
  }
};

/**
 * Convert USD amount to target currency (synchronous, uses cached rates)
 * @param {number} usdAmount - Amount in USD
 * @param {string} targetCurrency - Target currency code ('RUB', 'USD')
 * @returns {number} Converted amount
 */
export const convertCurrency = (usdAmount, targetCurrency) => {
  if (!usdAmount || isNaN(usdAmount)) return 0;
  
  switch (targetCurrency) {
    case 'RUB':
      return Math.round(usdAmount * EXCHANGE_RATES.USD_TO_RUB);
    case 'USD':
    default:
      return usdAmount;
  }
};

/**
 * Convert from any currency back to USD
 * @param {number} amount - Amount in source currency
 * @param {string} fromCurrency - Source currency code ('RUB', 'USD')
 * @returns {number} Amount in USD
 */
export const convertToUSD = (amount, fromCurrency) => {
  if (!amount || isNaN(amount)) return 0;
  
  switch (fromCurrency) {
    case 'RUB':
      return parseFloat((amount * EXCHANGE_RATES.RUB_TO_USD).toFixed(2));
    case 'USD':
    default:
      return amount;
  }
};

/**
 * Format price with appropriate currency symbol and positioning
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code ('USD', 'RUB')
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, currency = 'USD') => {
  if (!amount || isNaN(amount)) return '0';
  
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const roundedAmount = Math.round(amount);
  
  if (config.position === 'before') {
    return `${config.symbol}${roundedAmount}`;
  } else {
    return `${roundedAmount}${config.symbol}`;
  }
};

/**
 * Get currency symbol for a given currency code
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency) => {
  return CURRENCY_CONFIG[currency]?.symbol || '$';
};

/**
 * Convert and format price based on user's locale
 * @param {number} usdAmount - Original amount in USD
 * @param {string} locale - User's language locale
 * @returns {object} Object with converted amount, formatted price, and currency info
 */
export const convertAndFormatPrice = (usdAmount, locale) => {
  const targetCurrency = getCurrencyForLocale(locale);
  const convertedAmount = convertCurrency(usdAmount, targetCurrency);
  const formattedPrice = formatPrice(convertedAmount, targetCurrency);
  
  console.log('💱 convertAndFormatPrice:', { usdAmount, locale, targetCurrency, convertedAmount, formattedPrice });
  
  return {
    amount: convertedAmount,
    formatted: formattedPrice,
    currency: targetCurrency,
    symbol: getCurrencySymbol(targetCurrency)
  };
};

/**
 * Update exchange rates manually (calls MongoDB reload)
 */
export const updateExchangeRates = async () => {
  await loadExchangeRates();
};

/**
 * Clear exchange rates cache (useful when config is updated)
 */
export const clearExchangeRatesCache = () => {
  configCache = null;
  configCacheTimestamp = null;
};

/**
 * Fetch live exchange rates from an API (placeholder for future implementation)
 * @returns {Promise<object>} Exchange rates object
 */
export const fetchLiveExchangeRates = async () => {
  try {
    // Placeholder for future API integration
    // You can integrate with services like:
    // - https://api.exchangerate-api.com/v4/latest/USD
    // - https://api.fixer.io/latest?base=USD
    // - https://openexchangerates.org/api/latest.json
    
    console.log('💱 Live exchange rates not implemented yet, using static rates');
    return EXCHANGE_RATES;
  } catch (error) {
    console.error('❌ Error fetching live exchange rates:', error);
    return EXCHANGE_RATES; // Fallback to static rates
  }
};

export default {
  getCurrencyForLocale,
  convertCurrency,
  convertToUSD,
  formatPrice,
  getCurrencySymbol,
  convertAndFormatPrice,
  updateExchangeRates,
  fetchLiveExchangeRates,
  initializeExchangeRates,
  clearExchangeRatesCache
};
