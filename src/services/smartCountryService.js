import { CACHED_COUNTRIES, getFlagEmoji } from '../data/cachedCountries';
import { getAllCountries } from './plansServiceClient';

class SmartCountryService {
  constructor() {
    this.fullCountriesCache = null;
    this.isLoadingFullCountries = false;
    this.loadingPromise = null;
  }

  /**
   * Get countries immediately - returns cached popular countries first
   * @returns {Array} Array of popular countries
   */
  getImmediateCountries() {
    console.log('🚀 Returning cached countries immediately:', CACHED_COUNTRIES.length);
    return CACHED_COUNTRIES;
  }

  /**
   * Search countries - loads full list if needed
   * @param {string} searchTerm - Search term to filter countries
   * @returns {Promise<Array>} Filtered countries
   */
  async searchCountries(searchTerm = '') {
    // If no search term, return cached countries
    if (!searchTerm.trim()) {
      return this.getImmediateCountries();
    }

    console.log('🔍 Searching countries for:', searchTerm);

    // Load full countries if not already loaded
    await this.ensureFullCountriesLoaded();

    // Filter countries based on search term
    const allCountries = this.fullCountriesCache || CACHED_COUNTRIES;
    const filtered = allCountries.filter(country => 
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log(`✅ Found ${filtered.length} countries matching "${searchTerm}"`);
    return filtered;
  }

  /**
   * Get all countries - loads full list from API
   * @returns {Promise<Array>} All countries
   */
  async getAllCountries() {
    await this.ensureFullCountriesLoaded();
    return this.fullCountriesCache || CACHED_COUNTRIES;
  }

  /**
   * Ensure full countries are loaded from API
   * @returns {Promise<void>}
   */
  async ensureFullCountriesLoaded() {
    // If already loaded, return immediately
    if (this.fullCountriesCache) {
      return;
    }

    // If already loading, wait for existing promise
    if (this.isLoadingFullCountries && this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading
    this.isLoadingFullCountries = true;
    this.loadingPromise = this.loadFullCountries();
    
    try {
      await this.loadingPromise;
    } finally {
      this.isLoadingFullCountries = false;
      this.loadingPromise = null;
    }
  }

  /**
   * Load full countries from API
   * @returns {Promise<void>}
   */
  async loadFullCountries() {
    try {
      console.log('🌍 Loading full countries from API...');
      const countries = await getAllCountries();
      
      // Add flag emojis to countries that don't have them
      const countriesWithEmojis = countries.map(country => ({
        ...country,
        flagEmoji: country.flagEmoji || getFlagEmoji(country.code)
      }));

      this.fullCountriesCache = countriesWithEmojis;
      console.log(`✅ Loaded ${countriesWithEmojis.length} countries from API`);
    } catch (error) {
      console.error('❌ Failed to load full countries, using cached:', error);
      // Fallback to cached countries if API fails
      this.fullCountriesCache = CACHED_COUNTRIES;
    }
  }

  /**
   * Preload full countries in background (optional)
   * Call this to start loading countries without waiting
   */
  preloadCountries() {
    if (!this.fullCountriesCache && !this.isLoadingFullCountries) {
      console.log('🔄 Preloading countries in background...');
      this.ensureFullCountriesLoaded().catch(error => {
        console.error('❌ Background preload failed:', error);
      });
    }
  }

  /**
   * Clear cache (for testing or refresh)
   */
  clearCache() {
    this.fullCountriesCache = null;
    this.isLoadingFullCountries = false;
    this.loadingPromise = null;
    console.log('🗑️ Country cache cleared');
  }

  /**
   * Get cache status
   * @returns {Object} Cache status info
   */
  getCacheStatus() {
    return {
      hasCachedCountries: CACHED_COUNTRIES.length > 0,
      hasFullCountries: !!this.fullCountriesCache,
      isLoading: this.isLoadingFullCountries,
      cachedCount: CACHED_COUNTRIES.length,
      fullCount: this.fullCountriesCache?.length || 0
    };
  }
}

// Export singleton instance
const smartCountryService = new SmartCountryService();
export default smartCountryService;
