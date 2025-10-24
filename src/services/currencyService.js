/**
 * Currency conversion service for displaying prices in different currencies
 * Supports USD to RUB conversion for Russian language users
 */

// Exchange rates (you can update these or fetch from an API)
const EXCHANGE_RATES = {
  USD_TO_RUB: 95, // 1 USD = 95 RUB (approximate rate, update as needed)
  RUB_TO_USD: 0.0105 // 1 RUB = 0.0105 USD
};

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
 * Convert USD amount to target currency
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
  
  return {
    amount: convertedAmount,
    formatted: formattedPrice,
    currency: targetCurrency,
    symbol: getCurrencySymbol(targetCurrency)
  };
};

/**
 * Update exchange rates (for future API integration)
 * @param {object} newRates - New exchange rates object
 */
export const updateExchangeRates = (newRates) => {
  Object.assign(EXCHANGE_RATES, newRates);
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
  formatPrice,
  getCurrencySymbol,
  convertAndFormatPrice,
  updateExchangeRates,
  fetchLiveExchangeRates
};
