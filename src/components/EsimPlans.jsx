'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import PlanSelectionBottomSheet from './PlanSelectionBottomSheet';
// import { getCountriesWithPricing } from '../services/plansService'; // Removed - causes client-side issues
// import { getRegularSettings } from '../services/settingsService'; // Removed - causes client-side issues
import { useI18n } from '../contexts/I18nContext';
import { detectPlatform, shouldRedirectToDownload, isMobileDevice } from '../utils/platformDetection';
import { getMobileCountries } from '../data/mobileCountries';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';
import { translateCountries, translateCountryName } from '../utils/countryTranslations';
import smartCountryService from '../services/smartCountryService';
import { convertAndFormatPrice } from '../services/currencyService';
import { formatDataAndDays } from '../utils/languageUtils';

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

// Country name aliases for better search
const countryAliases = {
  'United States': ['USA', 'US', 'America', 'United States of America'],
  'United Kingdom': ['UK', 'Britain', 'Great Britain', 'England'],
  'United Arab Emirates': ['UAE', 'Emirates'],
  'South Korea': ['Korea', 'ROK', 'Republic of Korea'],
  'Czech Republic': ['Czechia'],
  'Netherlands': ['Holland'],
  'Switzerland': ['Swiss'],
  'New Zealand': ['NZ'],
  'South Africa': ['RSA'],
  'Dominican Republic': ['DR'],
  'Costa Rica': ['CR']
};

// Helper function to check if search term matches country name or aliases
const matchesCountrySearch = (countryName, searchTerm) => {
  const lowerSearch = searchTerm.toLowerCase();
  const lowerCountry = countryName.toLowerCase();
  
  // Direct name match
  if (lowerCountry.includes(lowerSearch)) {
    return true;
  }
  
  // Check aliases
  const aliases = countryAliases[countryName] || [];
  return aliases.some(alias => alias.toLowerCase().includes(lowerSearch) || lowerSearch.includes(alias.toLowerCase()));
};



const EsimPlansContent = () => {
  const { t, locale: contextLocale } = useI18n();
  // Force Russian locale for main page
  const locale = 'ru';
  
  console.log('🏠 EsimPlans locale check:', { locale, contextLocale, tFunction: typeof t });
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Debug authentication state
  console.log('🔍 EsimPlans: currentUser:', currentUser);
  console.log('🔍 EsimPlans: userProfile:', userProfile);
  console.log('🔍 EsimPlans: loading:', loading);
  console.log('🌐 EsimPlans: locale:', locale);
  
  // Determine if this is the dedicated plans page or landing page
  const isPlansPage = pathname === '/esim-plans' || pathname.includes('/esim-plans') || 
                      pathname.includes('/ar/esim-plans') || pathname.includes('/he/esim-plans') ||
                      pathname.includes('/ru/esim-plans') || pathname.includes('/de/esim-plans') ||
                      pathname.includes('/fr/esim-plans') || pathname.includes('/es/esim-plans');
  
  // Detect RTL language
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';
  
  // Check if parent already has RTL direction set
  const parentHasRTL = typeof document !== 'undefined' && 
    document.querySelector('[dir="rtl"]') !== null;
  
  // Get search term from URL params
  const urlSearchTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [platformInfo, setPlatformInfo] = useState(null);
  
  // Plan selection and checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Discount settings state
  const [regularSettings, setRegularSettings] = useState({ 
    discountPercentage: parseInt(process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE) || 20, 
    minimumPrice: parseFloat(process.env.NEXT_PUBLIC_MINIMUM_PRICE) || 4 
  });
  
  // Simplified state - no sorting or grouping
  const [groupByDays, setGroupByDays] = useState(false); // Disable grouping by days

  // Sync search term with URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Platform detection and authentication check
  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatformInfo(detectedPlatform);
    
    // No automatic redirect - users can browse freely
    // They will be prompted to download app when they tap on countries
  }, [currentUser, router]);


  // Fetch discount settings
  useEffect(() => {
    const fetchDiscountSettings = async () => {
      try {
        const { getRegularSettings } = await import('../services/settingsServiceClient');
        const regular = await getRegularSettings();
        console.log('💰 Regular discount settings loaded:', regular);
        setRegularSettings(regular);
      } catch (error) {
        console.error('Error fetching discount settings:', error);
        // Keep default settings
      }
    };
    
    fetchDiscountSettings();
  }, []);

  // Fetch countries - ALWAYS use API data for truth
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ['countries-with-pricing', locale],
    queryFn: async () => {
      try {
        console.log('📊 Fetching REAL API data for accurate pricing...');
        const { getCountriesWithPricing } = await import('../services/plansServiceClient');
        const countriesWithPricing = await getCountriesWithPricing();
        
        // Filter to show only countries with plans (minPrice < 999 indicates real data)
        const countriesWithRealPricing = countriesWithPricing.filter(country => 
          country.minPrice < 999 && country.plansCount > 0
        );
        
        // Sort by minimum price (cheapest first)
        countriesWithRealPricing.sort((a, b) => a.minPrice - b.minPrice);
        
        // Limit to 8 for home page, show all for plans page
        const limitedCountries = isPlansPage ? countriesWithRealPricing : countriesWithRealPricing.slice(0, 8);
        
        console.log('✅ USING REAL API DATA - NO MORE LIES!');
        console.log('Real data sample prices:', limitedCountries.slice(0, 5).map(c => ({ 
          name: c.name, 
          minPrice: c.minPrice 
        })));
        return limitedCountries;
      } catch (error) {
        console.error('❌ API ERROR:', error);
        // Return empty array if API fails - no fallback to wrong hardcoded data
        console.log('🔄 Returning empty array - no fallback to incorrect hardcoded data');
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });



  useEffect(() => {
    console.log('useEffect triggered:', { 
      countriesData: countriesData?.length, 
      countriesLoading, 
      countriesError
    });
    
    if (countriesData) {
      console.log('Setting countries data:', countriesData);
      // Translate countries based on current locale
      const translatedCountries = translateCountries(countriesData, locale);
      setCountries(translatedCountries);
      setFilteredCountries(translatedCountries);
    } else if (countriesError) {
      console.log('API error, no data available:', countriesError);
      setCountries([]);
      setFilteredCountries([]);
    }
  }, [countriesData, countriesError, countriesLoading, locale]);

  // Search function - uses smart country service for immediate results
  const searchCountries = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use smart country service for all searches
      console.log('🔍 Smart search for:', term);
      const searchResults = await smartCountryService.searchCountries(term);
      
      // Translate results based on current locale
      const translatedResults = translateCountries(searchResults, locale);
      setSearchResults(translatedResults);
      setIsSearching(false);
      return;
      
      console.log('📊 Plans page search - Using API:', term);
      
      // Plans page: Search using API
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
        
        // Get countries from API
        const countriesResponse = await fetch(`${API_BASE_URL}/api/public/countries`);
        if (!countriesResponse.ok) {
          throw new Error(`Countries API failed: ${countriesResponse.status}`);
        }
        
        const countriesData = await countriesResponse.json();
        if (!countriesData.success) {
          throw new Error(countriesData.error || 'Failed to fetch countries');
        }
        
        const countries = countriesData.data.countries;
        const firebaseResults = [];
        
        for (const countryData of countries) {
          // Translate country name to Russian for search
          const translatedName = translateCountryName(countryData.code, countryData.name, 'ru');
          
          // Check if country name matches search term (including aliases and translations)
          const matchesEnglish = matchesCountrySearch(countryData.name, term);
          const matchesRussian = translatedName.toLowerCase().includes(term.toLowerCase());
          
          console.log(`🔍 Checking ${countryData.name}:`, {
            translated: translatedName,
            searchTerm: term,
            matchesEnglish,
            matchesRussian
          });
          
          if (matchesEnglish || matchesRussian) {
            // Get plans for this country using API
            const plansResponse = await fetch(`${API_BASE_URL}/api/public/plans?country=${countryData.code}`);
            if (plansResponse.ok) {
              const plansData = await plansResponse.json();
              const plans = plansData.success ? plansData.data.plans : [];
              
              // Filter out plans with invalid prices and calculate minimum
              const validPrices = plans
                .map(plan => parseFloat(plan.price))
                .filter(price => !isNaN(price) && price > 0);
              
              const minPrice = validPrices.length > 0 
                ? Math.min(...validPrices)
                : null; // Use null instead of 999 fallback
              
              // Debug logging
              console.log(`🔍 Search result for ${countryData.name}:`, {
                plansFound: plans.length,
                validPrices: validPrices.length,
                minPrice: minPrice,
                allPrices: plans.map(p => p.price)
              });
              
              firebaseResults.push({
                ...countryData,
                minPrice: minPrice,
                flagEmoji: countryData.flagEmoji || getFlagEmoji(countryData.code)
              });
            }
          }
        }
        
        console.log('API search results:', firebaseResults.length);
        // Translate API search results based on current locale
        const translatedResults = translateCountries(firebaseResults, locale);
        setSearchResults(translatedResults);
        
      } catch (apiError) {
        console.error('❌ API search failed:', apiError);
        setSearchResults([]);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchCountries(searchTerm);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 200); // 200ms debounce for faster response

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Helper function to calculate discounted price - ALWAYS use regular discount only
  const calculateDiscountedPrice = (originalPrice) => {
    if (!originalPrice || originalPrice <= 0) return originalPrice;
    
    // ALWAYS apply regular discount (for both landing pages and plans page)
    const discountPercentage = regularSettings.discountPercentage || parseInt(process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE) || 20;
    const minimumPrice = regularSettings.minimumPrice || parseFloat(process.env.NEXT_PUBLIC_MINIMUM_PRICE) || 4;
    
    const discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
    return discountedPrice;
  };

  // Simple filter function with priority countries for plans page
  const filterCountries = (countriesList) => {
    // Priority countries for plans page
    const priorityCountries = [
      'United States', 'USA', 'South Korea', 'Korea', 'Japan', 
      'Belgium', 'Spain', 'Canada', 'Portugal', 'Thailand'
    ];
    
    if (isPlansPage && !searchTerm) {
      // Separate priority countries and others
      const priority = [];
      const others = [];
      
      countriesList.forEach(country => {
        const isPriority = priorityCountries.some(pc => 
          country.name.toLowerCase().includes(pc.toLowerCase()) ||
          pc.toLowerCase().includes(country.name.toLowerCase())
        );
        
        if (isPriority) {
          priority.push(country);
        } else {
          others.push(country);
        }
      });
      
      // Return priority countries first, then others
      return [...priority, ...others];
    }
    
    return [...countriesList]; // Return countries as-is for other cases
  };


  // Filter countries based on search term
  useEffect(() => {
    let countriesToFilter = searchTerm ? searchResults : countries;
    let filtered = filterCountries(countriesToFilter);
    setFilteredCountries(filtered);
  }, [searchTerm, countries, searchResults]);

  const handleCountrySelect = async (country) => {
    console.log('🔍 DEBUG: handleCountrySelect called');
    console.log('🛒 User selected country:', country.name);
    
    // Always open bottom sheet to show plans
    setShowCheckoutModal(true);
    setLoadingPlans(true);
    await loadAvailablePlansForCountry(country.code);
  };

  // Load available plans for a specific country
  const loadAvailablePlansForCountry = async (countryCode) => {
    try {
      console.log('📦 Loading plans for country:', countryCode);
      
      // Use API endpoint instead of direct Firestore access
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
      const response = await fetch(`${API_BASE_URL}/api/public/plans?country=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const plans = data.data.plans;
        console.log(`✅ Loaded ${plans.length} plans for ${countryCode} from API`);
        setAvailablePlans(plans);
      } else {
        throw new Error(data.error || 'Failed to fetch plans');
      }
    } catch (error) {
      console.error('❌ Error loading plans for country:', error);
      setAvailablePlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };


  // No fallback timeout - only show real API data


  return (
    <>
      <section className="destination py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Active Search Badge */}
          {searchTerm && (
            <div className="mb-6 flex justify-center items-center gap-3">
              <span className="text-sm text-gray-300">
                Поиск по: <span className="font-semibold text-blue-400">{searchTerm}</span>
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  router.push(pathname);
                }}
                className="text-xs px-3 py-1 rounded-full bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 hover:text-white transition-colors"
              >
                Очистить
              </button>
            </div>
          )}

        {/* Local eSIMs Content */}
        <div className={`tab-content ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={`tab-pane fade show active ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              {/* Loading state for countries */}
              {countriesLoading && countries.length === 0 ? (
                <div className="flex justify-center items-center min-h-64">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tufts-blue"></div>
                  <p className="ml-4 text-gray-600">{t('plans.loadingPlans', 'Loading countries...')}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Records Layout */}
                  <div className="hidden sm:block max-w-4xl mx-auto">
                    <div className="bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 overflow-hidden">
                      {(isPlansPage || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                        <button
                          key={country.id}
                          className="w-full px-6 py-4 border-b border-gray-700/30 last:border-b-0 hover:bg-gray-700/30 transition-colors duration-200 flex items-center justify-between"
                          onClick={() => handleCountrySelect(country)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {country.flagEmoji ? (
                                <span className="text-2xl">{country.flagEmoji}</span>
                              ) : (
                                <div className="w-8 h-8 bg-tufts-blue rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {country.code || '??'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="text-lg font-semibold text-white">{translateCountryName(country.code, country.name, locale)}</h3>
                              <p className="text-sm text-gray-400">1ГБ • 7 дней</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {country.minPrice && country.minPrice < 999 ? (() => {
                              const originalPrice = country.minPrice;
                              const discountedPrice = calculateDiscountedPrice(originalPrice);
                              // Always show the minimum price of $4, never below
                              const finalPrice = Math.max(4, discountedPrice);
                              const hasDiscount = finalPrice < originalPrice;
                              return hasDiscount ? (
                                <div>
                                  <div className="text-lg font-semibold text-green-400">
                                    {convertAndFormatPrice(finalPrice, locale).formatted}
                                  </div>
                                  <div className="text-sm text-gray-500 line-through">
                                    {convertAndFormatPrice(originalPrice, locale).formatted}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-lg font-semibold text-white">
                                  {convertAndFormatPrice(originalPrice, locale).formatted}
                                </div>
                              );
                            })() : (
                              <div className="text-lg font-medium text-gray-500">No plans</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mobile Records Layout */}
                  <div className="sm:hidden">
                    <div className="bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700/50 overflow-hidden">
                      {(isPlansPage || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                        <button
                          key={country.id}
                          className="w-full px-3 py-2 border-b border-gray-700/30 last:border-b-0 hover:bg-gray-700/30 transition-colors duration-200 flex items-center justify-between"
                          onClick={() => handleCountrySelect(country)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {country.flagEmoji ? (
                                <span className="text-xl">{country.flagEmoji}</span>
                              ) : (
                                <div className="w-6 h-6 bg-tufts-blue rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {country.code || '??'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="text-sm font-semibold text-white">{translateCountryName(country.code, country.name, locale)}</h3>
                              <p className="text-xs text-gray-400">1ГБ • 7 дней</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {country.minPrice && country.minPrice < 999 ? (() => {
                              const originalPrice = country.minPrice;
                              const discountedPrice = calculateDiscountedPrice(originalPrice);
                              // Always show the minimum price of $4, never below
                              const finalPrice = Math.max(4, discountedPrice);
                              const hasDiscount = finalPrice < originalPrice;
                              return hasDiscount ? (
                                <div>
                                  <div className="text-sm font-semibold text-green-400">
                                    {convertAndFormatPrice(finalPrice, locale).formatted}
                                  </div>
                                  <div className="text-xs text-gray-500 line-through">
                                    {convertAndFormatPrice(originalPrice, locale).formatted}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm font-semibold text-gray-900">
                                  {convertAndFormatPrice(originalPrice, locale).formatted}
                                </div>
                              );
                            })() : (
                              <div className="text-sm font-medium text-gray-500">No plans</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>



        {/* Empty State */}
      </div>
    </section>

    {/* Plan Selection Bottom Sheet */}
    <PlanSelectionBottomSheet
      isOpen={showCheckoutModal}
      onClose={() => setShowCheckoutModal(false)}
      availablePlans={availablePlans}
      loadingPlans={loadingPlans}
      filteredCountries={filteredCountries}
    />
    </>
  );
};

// Wrapper component with Suspense
const EsimPlans = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    }>
      <EsimPlansContent />
    </Suspense>
  );
};

export default EsimPlans;
