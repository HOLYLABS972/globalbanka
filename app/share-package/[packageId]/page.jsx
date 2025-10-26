'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Globe, 
  Wifi, 
  Clock, 
  Shield, 
  Zap,
  Smartphone,
  DollarSign,
  Gift
} from 'lucide-react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useI18n } from '../../../src/contexts/I18nContext';
import { getLanguageDirection } from '../../../src/utils/languageUtils';
import { convertAndFormatPrice } from '../../../src/services/currencyService';
import toast from 'react-hot-toast';
import { apiService, getApiKey } from '../../../src/services/apiServiceClient';

const SharePackagePage = () => {
  console.log('🎯 SharePackagePage component loaded');
  console.log('🎯 Component is rendering');
  console.log('🔑 Environment Variables Test:');
  console.log('NEXT_PUBLIC_ROAMJET_API_KEY:', process.env.NEXT_PUBLIC_ROAMJET_API_KEY);
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('NEXT_PUBLIC_DISCOUNT_PERCENTAGE:', process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE);
  
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { t, locale } = useI18n();
  const packageId = params.packageId;
  
  console.log('🔐 Auth Debug:', {
    currentUser: currentUser,
    hasUser: !!currentUser,
    userUid: currentUser?.uid,
    userEmail: currentUser?.email
  });
  
  console.log('🎯 Package ID:', packageId);
  console.log('🎯 Current user:', currentUser ? 'logged in' : 'not logged in');
  
  // RTL support
  const isRTL = getLanguageDirection(locale) === 'rtl';
  
  // Get country info from URL parameters
  const [urlCountryCode, setUrlCountryCode] = useState(null);
  const [urlCountryFlag, setUrlCountryFlag] = useState(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlCountryCode(searchParams.get('country'));
      setUrlCountryFlag(searchParams.get('flag'));
    }
  }, []);
  
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regularSettings, setRegularSettings] = useState({ 
    discountPercentage: parseInt(process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE) || 20, 
    minimumPrice: parseFloat(process.env.NEXT_PUBLIC_MINIMUM_PRICE) || 0.5 
  });
  const [environmentMode, setEnvironmentMode] = useState(null);
  const [apiKeyMode, setApiKeyMode] = useState(null);
  const [roamjetApiKey, setRoamjetApiKey] = useState('Not set');
  const [balanceInfo, setBalanceInfo] = useState({ balance: 0, hasInsufficientFunds: false, minimumRequired: 4, mode: 'production' });

  const loadFromAPI = useCallback(async () => {
    try {
      console.log('🔍 Searching for package:', packageId);
      // Packages are now loaded from Firestore dataplans collection
      // This function is kept for backwards compatibility
      return false;
    } catch (error) {
      console.error('❌ Error loading package:', error);
      return false;
    }
  }, [packageId]);

  const loadPackageData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading package data for ID:', packageId);
      
      // Try to load from API first
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
        console.log('📦 Fetching package from API:', `${API_BASE_URL}/api/public/plans`);
        
        const response = await fetch(`${API_BASE_URL}/api/public/plans`);
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          const plans = data.data.plans;
          const packagePlan = plans.find(plan => plan.id === packageId);
          
          if (packagePlan) {
            console.log('✅ Found package in API:', packagePlan);
            setPackageData(packagePlan);
            return; // Package found, exit early
          } else {
            console.log('❌ Package not found in API plans');
            console.log('Package ID:', packageId);
            console.log('Available plan IDs:', plans.map(p => p.id).slice(0, 5));
          }
        } else {
          throw new Error('Failed to fetch plans. Please contact support.');
        }
      } catch (apiError) {
        console.error('❌ API fetch failed:', apiError);
        console.log('Package ID:', packageId);
        console.log('URL Country Code:', urlCountryCode);
      }
    } catch (error) {
      console.error('❌ Error loading package data:', error);
      toast.error('Failed to load package information');
    } finally {
      setLoading(false);
    }
  }, [packageId, urlCountryCode]);

  // Load discount settings - use environment variables instead of MongoDB
  const loadDiscountSettings = useCallback(async () => {
    try {
      // Use environment variables instead of MongoDB to avoid client-side connection errors
      const regular = {
        discountPercentage: parseInt(process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE) || 20,
        minimumPrice: parseFloat(process.env.NEXT_PUBLIC_MINIMUM_PRICE) || 0.5
      };
      setRegularSettings(regular);
      console.log('⚙️ Using environment settings:', { regular });
    } catch (error) {
      console.error('Error loading discount settings:', error);
    }
  }, []);

  useEffect(() => {
    if (packageId) {
      loadPackageData();
    }
  }, [packageId, loadPackageData]);

  useEffect(() => {
    loadDiscountSettings();
  }, [loadDiscountSettings]);

  // Fetch RoamJet API key for display (works without authentication)
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('🔑 Fetching RoamJet API key for display...');
        console.log('🔑 Environment variable check:', process.env.NEXT_PUBLIC_ROAMJET_API_KEY);
        const roamjetApiKey = await getApiKey();
        console.log('🔑 Raw API key from getApiKey:', roamjetApiKey);
        setRoamjetApiKey(roamjetApiKey ? `${roamjetApiKey.substring(0, 15)}...` : 'Not set');
        console.log('🔑 RoamJet API key set:', roamjetApiKey ? `${roamjetApiKey.substring(0, 15)}...` : 'Not set');
      } catch (error) {
        console.error('❌ Error getting RoamJet API key:', error);
        setRoamjetApiKey('Not set');
      }
    };
    
    fetchApiKey();
  }, []); // Run once on component mount

  // Check business balance and detect API key mode
  useEffect(() => {
    console.log('🚀 Balance check useEffect triggered');
    console.log('🚀 Current user from useAuth:', currentUser ? currentUser.uid : 'null');
    
    // Only run balance check if user is authenticated
    if (!currentUser) {
      console.log('⏳ User not authenticated yet, skipping balance check');
      return;
    }
    
    const checkMode = async () => {
      try {
        console.log('🔍 Starting mode detection...');
        
        // Use environment variables instead of MongoDB services
        const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
        const apiKeyMode = roamjetApiKey && roamjetApiKey.includes('sandbox') ? 'sandbox' : 'production';
        console.log('🔑 Detected API key mode:', apiKeyMode);
        
        // Set environment mode based on API key mode
        setEnvironmentMode(apiKeyMode === 'sandbox' ? 'sandbox' : 'production');
        setApiKeyMode(apiKeyMode);
        
        // Set balance info with mode detection
        const balanceInfo = {
          balance: 0,
          hasInsufficientFunds: false, // Allow purchases in both modes
          minimumRequired: 4,
          mode: apiKeyMode,
          apiKey: roamjetApiKey || 'No API key found (localhost)'
        };
        
        setBalanceInfo(balanceInfo);
        
        console.log('🔑 Final mode used:', apiKeyMode);
        console.log('🔒 Will disable purchase button:', balanceInfo.hasInsufficientFunds && apiKeyMode !== 'sandbox');
        console.log('📊 Debug info:', {
          hasInsufficientFunds: balanceInfo.hasInsufficientFunds,
          mode: apiKeyMode,
          disableButton: balanceInfo.hasInsufficientFunds && apiKeyMode !== 'sandbox'
        });
        
        // Log URL parameters for debugging
        if (urlCountryCode || urlCountryFlag) {
          console.log('🌐 URL parameters detected:', {
            country: urlCountryCode,
            flag: urlCountryFlag,
            detectedMode: apiKeyMode,
            balance: balanceInfo
          });
        }
      } catch (error) {
        console.error('Error detecting mode:', error);
      }
    };
    checkMode();
  }, [currentUser]); // Run when user authentication changes

  const handlePurchase = async () => {
    if (!currentUser) {
      toast.error('Please log in to purchase this package');
      
      // Get language prefix from pathname to preserve language
      const langMatch = pathname.match(/^\/(ar|de|es|fr|he|ru)\//);
      const langPrefix = langMatch ? `/${langMatch[1]}` : '';
      
      router.push(`${langPrefix}/login`);
      return;
    }
    
    if (!packageData) {
      toast.error('Package data not loaded yet');
      return;
    }
    
    // Calculate discounted price - use EITHER basic OR referral discount (not both)
    const originalPrice = parseFloat(packageData.price);
    
    // Apply regular discount
    const appliedDiscountPercent = regularSettings.discountPercentage || parseInt(process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE) || 20;
    let finalPrice = originalPrice * (100 - appliedDiscountPercent) / 100;
    
    // Apply minimum price constraint
    const minimumPrice = regularSettings.minimumPrice || parseFloat(process.env.NEXT_PUBLIC_MINIMUM_PRICE) || 0.5;
    finalPrice = Math.max(minimumPrice, finalPrice);
    
    console.log('💰 Pricing calculation:', {
      originalPrice,
      appliedDiscountPercent,
      finalPrice,
      minimumPrice
    });
    
    // Store package data in localStorage for the checkout process
    const checkoutData = {
      packageId: packageId,
      packageName: packageData.name,
      packageDescription: packageData.description,
      priceUSD: finalPrice, // Use discounted price in USD (for Stripe)
      priceRUB: convertAndFormatPrice(finalPrice, locale).amount, // Display price in RUB
      originalPrice: originalPrice, // Keep original price for reference
      currency: 'USD', // Always store as USD for API
      data: packageData.data,
      dataUnit: 'ГБ',
      period: packageData.validity || packageData.period || packageData.duration,
      country_code: packageData.country_code,
      benefits: packageData.benefits || [],
      speed: packageData.speed
    };
    
    console.log('💾 Storing checkout data:', checkoutData);
    
    localStorage.setItem('selectedPackage', JSON.stringify(checkoutData));
    
    // Redirect to checkout page which will use Stripe
    console.log('🛒 Redirecting to checkout page with Stripe payment');
    router.push('/checkout');
  };

  const formatPrice = (price) => {
    // Handle cases where price might already be a string with currency symbol
    let numericPrice = price;
    if (typeof price === 'string') {
      // Remove any existing currency symbols and parse as number
      numericPrice = parseFloat(price.replace(/[$€£¥]/g, '')) || 0;
    }
    
    // Return just the number without currency symbol
    return numericPrice.toFixed(2);
  };

  const formatData = (data, unit = 'ГБ') => {
    if (data === 'Unlimited' || data === 'unlimited' || data === -1) {
      return 'Безлимитный';
    }
    
    // Clean data if it has GB in it
    const cleanData = typeof data === 'string' ? data.replace(/GB/gi, '').replace(/гб/gi, '').replace(/\s/g, '') : data;
    
    return `${cleanData} ${unit}`;
  };

  const getCountryFlag = (countryCode) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a202c] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка информации о тарифе...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-[#1a202c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/90 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Тариф не найден</h3>
          <p className="text-gray-300 mb-4">
            Тариф, который вы ищете, не существует или был удален
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Посмотреть доступные тарифы
          </button>
        </div>
      </div>
    );
  }

  // Use actual mode detection
  const currentMode = balanceInfo.mode || 'sandbox'; // Default to sandbox if not detected yet
  
  console.log('🔍 CURRENT MODE:', currentMode);
  console.log('🔍 BALANCE INFO:', balanceInfo);

  return (
    <div className="min-h-screen bg-[#1a202c]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Детали тарифа</h1>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Package Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/90 backdrop-blur-md shadow-lg rounded-xl overflow-hidden lg:col-span-1 border border-gray-700/50"
          >
          {/* Package Title */}
          <div className="bg-gray-800/90 backdrop-blur-md p-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white">{packageData.name}</h2>
              <p className="text-gray-300 text-lg mt-2">Этот eSIM не включает номер телефона</p>
            </div>
          </div>
          
          {/* Package Stats */}
          <div className="bg-gray-800/90 backdrop-blur-md px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Wifi className="w-5 h-5 text-blue-400" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-400">Данные</div>
                    <div className="font-semibold text-white">{formatData(packageData.data, packageData.dataUnit)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-400">Срок действия</div>
                    <div className="font-semibold text-white">{packageData.validity || packageData.period || packageData.duration || 'N/A'} {packageData.validity_unit || 'дней'}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-400">Цена</div>
                    {(() => {
                      const originalPrice = parseFloat(packageData.price);
                      // Apply regular discount
                      const discountPercent = regularSettings.discountPercentage || parseInt(process.env.NEXT_PUBLIC_DISCOUNT_PERCENTAGE) || 20;
                      let finalPrice = originalPrice * (100 - discountPercent) / 100;
                      
                      // Apply minimum price constraint
                      const minimumPrice = regularSettings.minimumPrice || parseFloat(process.env.NEXT_PUBLIC_MINIMUM_PRICE) || 0.5;
                      finalPrice = Math.max(minimumPrice, finalPrice);
                      
                      return (
                        <div>
                          <div className="font-semibold text-green-400">
                            {convertAndFormatPrice(finalPrice, 'ru').formatted}
                          </div>
                          <div className="text-xs text-gray-500 line-through">
                            {convertAndFormatPrice(parseFloat(packageData.price), 'ru').formatted}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <span className="text-2xl">
                    {urlCountryFlag || (packageData.country_code ? getCountryFlag(packageData.country_code) : '🌍')}
                  </span>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-400">Страна</div>
                    <div className="font-semibold text-white">{urlCountryCode || packageData.country_code || 'DE'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Actions */}
          <div className="p-6">
            <div className="max-w-2xl mx-auto">
              {/* Get Package Section */}
              <div className="text-center mb-8">
                <h3 className={`text-2xl font-semibold text-white mb-4 ${isRTL ? 'text-right' : 'text-center'}`}>Получить этот тариф</h3>
                <button
                  onClick={handlePurchase}
                  disabled={!packageData} // Only disable if package data is not loaded
                  className={`w-full max-w-md mx-auto flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-colors font-medium text-lg shadow-lg ${
                    !packageData
                      ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                      : 'bg-blue-400 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span>
                    {!packageData
                      ? 'Загрузка...' 
                      : 'Купить сейчас'}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
        
        {/* Right Column - How to Use */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:block"
        >
          <div className="p-6">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Как использовать</h3>
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-yellow-400/20 backdrop-blur-sm p-3 rounded-full mb-3">
                  <Zap className="w-8 h-8 text-yellow-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Мгновенная активация</h4>
                <p className="text-sm text-gray-300">Подключайтесь сразу после покупки</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-400/20 backdrop-blur-sm p-3 rounded-full mb-3">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Безопасно и надежно</h4>
                <p className="text-sm text-gray-300">Доверяют миллионы путешественников по всему миру</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-400/20 backdrop-blur-sm p-3 rounded-full mb-3">
                  <Globe className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Глобальное покрытие</h4>
                <p className="text-sm text-gray-300">Оставайтесь на связи, где бы вы ни были</p>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SharePackagePage;
