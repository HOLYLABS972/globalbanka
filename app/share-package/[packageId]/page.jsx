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
      price: finalPrice, // Use discounted price
      originalPrice: originalPrice, // Keep original price for reference
      currency: packageData.currency || 'USD',
      data: packageData.data,
      dataUnit: packageData.dataUnit || 'GB',
      period: packageData.validity || packageData.period || packageData.duration,
      country_code: packageData.country_code,
      benefits: packageData.benefits || [],
      speed: packageData.speed
    };
    
    console.log('💾 Storing checkout data:', checkoutData);
    
    localStorage.setItem('selectedPackage', JSON.stringify(checkoutData));
    
    // Call payment service directly instead of going to checkout page
    const { paymentService } = await import('../../../src/services/paymentServiceClient');
    
    try {
      // Generate unique order ID for each purchase
      const uniqueOrderId = `${packageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order data for payment service
      const orderData = {
        orderId: uniqueOrderId, // Unique order ID for each purchase
        planId: packageId,
        planName: packageData.name,
        customerEmail: currentUser.email,
        amount: finalPrice, // Use discounted price
        currency: 'usd',
        originalAmount: originalPrice // Include original amount for reference
      };
      
      console.log('💳 Order data for payment:', orderData);
      
      // Create checkout session
      const result = await paymentService.createCheckoutSession(orderData);
      
      if (result.sessionId && result.url) {
        console.log('✅ Redirecting to payment:', result.url);
        
        // Redirect to Stripe checkout with iframe detection (copied from esim-shop)
        console.log('🔄 Redirecting to Stripe checkout for single order:', result.url);
        
        // Check if we're in an iframe
        if (window !== window.top) {
          console.log('🔗 Detected iframe context - redirecting parent window');
          // Redirect the parent window instead of the iframe
          try {
            window.top.location.href = result.url;
          } catch (error) {
            console.warn('⚠️ Cannot redirect parent window, trying alternative method');
            // Alternative: open in new window
            window.open(result.url, '_blank');
          }
        } else {
          console.log('🖥️ Normal window context - redirecting current window');
          window.location.href = result.url;
        }
      } else {
        throw new Error('Invalid payment session response');
      }
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      
      // Show user-friendly error message
      if (error.message.includes('not configured for this domain')) {
        toast.error('Payment system configuration issue. Please contact support.');
      } else {
        toast.error('Failed to process payment. Please try again.');
      }
    }
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

  const formatData = (data, unit = 'GB') => {
    if (data === 'Unlimited' || data === -1) {
      return 'Unlimited';
    }
    
    // Handle cases where data might already contain the unit
    if (typeof data === 'string' && data.includes(unit)) {
      return data; // Return as-is if unit is already included
    }
    
    return `${data} ${unit}`;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('sharePackage.loadingPackageInfo', 'Loading package information...')}</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('sharePackage.packageNotFound', 'Package Not Found')}</h3>
          <p className="text-gray-600 mb-4">
            {t('sharePackage.packageNotFoundDesc', 'The package you\'re looking for doesn\'t exist or has been removed')}
          </p>
          <button
            onClick={() => {
              // Get language prefix from pathname to preserve language
              const langMatch = pathname.match(/^\/(ar|de|es|fr|he|ru)\//);
              const langPrefix = langMatch ? `/${langMatch[1]}` : '';
              router.push(`${langPrefix}/esim-plans`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Browse Available Packages
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
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{t('sharePackage.packageDetails', 'Package Details')}</h1>
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
            className="bg-white shadow-lg rounded-xl overflow-hidden"
          >
          {/* Package Title */}
          <div className="bg-white p-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-black">{packageData.name}</h2>
              <p className="text-gray-600 text-lg mt-2">{t('sharePackage.noPhoneNumber', 'This eSIM doesn\'t come with a number')}</p>
            </div>
          </div>
          
          {/* Package Stats */}
          <div className="bg-white px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Wifi className="w-5 h-5 text-gray-600" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.data', 'Data')}</div>
                    <div className="font-semibold text-black">{formatData(packageData.data, packageData.dataUnit)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.validity', 'Validity')}</div>
                    <div className="font-semibold text-black">{packageData.validity || packageData.period || packageData.duration || 'N/A'} {packageData.validity_unit || 'days'}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.price', 'Price')}</div>
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
                          <div className="font-semibold text-red-600">
                            ${finalPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 line-through">${formatPrice(packageData.price)}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <span className="text-2xl">
                    {urlCountryFlag || (packageData.country_code ? getCountryFlag(packageData.country_code) : '🌍')}
                  </span>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.country', 'Country')}</div>
                    <div className="font-semibold text-black">{urlCountryCode || packageData.country_code || 'DE'}</div>
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
                <h3 className={`text-2xl font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.getThisPackage', 'Get This Package')}</h3>
                <button
                  onClick={handlePurchase}
                  disabled={!packageData} // Only disable if package data is not loaded
                  className={`w-full max-w-md mx-auto flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-colors font-medium text-lg shadow-lg ${
                    !packageData
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span>
                    {!packageData
                      ? t('sharePackage.loading', 'Loading...') 
                      : t('sharePackage.purchaseNow', 'Purchase Now')}
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
            className="hidden lg:block"
          >
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">{t('sharePackage.howToUse', 'How to Use')}</h3>
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-yellow-100 p-3 rounded-full mb-3">
                    <Zap className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('sharePackage.instantActivation', 'Instant Activation')}</h4>
                  <p className="text-sm text-gray-600">{t('sharePackage.instantActivationDesc', 'Get connected immediately after purchase')}</p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 p-3 rounded-full mb-3">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('sharePackage.secureReliable', 'Secure & Reliable')}</h4>
                  <p className="text-sm text-gray-600">{t('sharePackage.secureReliableDesc', 'Trusted by millions of travelers worldwide')}</p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-3">
                    <Globe className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('sharePackage.globalCoverage', 'Global Coverage')}</h4>
                  <p className="text-sm text-gray-600">{t('sharePackage.globalCoverageDesc', 'Stay connected wherever you go')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* How to Use Section - Mobile Only */}
      <div className="lg:hidden bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">{t('sharePackage.howToUse', 'How to Use')}</h3>
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="bg-yellow-100 p-3 rounded-full mb-3">
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('sharePackage.instantActivation', 'Instant Activation')}</h4>
                <p className="text-sm text-gray-600">{t('sharePackage.instantActivationDesc', 'Get connected immediately after purchase')}</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('sharePackage.secureReliable', 'Secure & Reliable')}</h4>
                <p className="text-sm text-gray-600">{t('sharePackage.secureReliableDesc', 'Trusted by millions of travelers worldwide')}</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('sharePackage.globalCoverage', 'Global Coverage')}</h4>
                <p className="text-sm text-gray-600">{t('sharePackage.globalCoverageDesc', 'Stay connected wherever you go')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePackagePage;
