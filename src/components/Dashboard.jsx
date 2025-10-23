'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useRouter, usePathname } from 'next/navigation';
import { esimService } from '../services/esimServiceMongo';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';
import { translateCountryName } from '../utils/countryTranslations';
import toast from 'react-hot-toast';

// Dashboard Components
import DashboardHeader from './dashboard/DashboardHeader';
import StatsCards from './dashboard/StatsCards';
import RecentOrders from './dashboard/RecentOrders';
import AccountSettings from './dashboard/AccountSettings';
import QRCodeModal from './dashboard/QRCodeModal';
import EsimDetailsModal from './dashboard/EsimDetailsModal';
import EsimUsageModal from './dashboard/EsimUsageModal';

const Dashboard = () => {
  const { currentUser, userProfile, loadUserProfile, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState(null);
  const [esimDetails, setEsimDetails] = useState(null);
  const [loadingEsimDetails, setLoadingEsimDetails] = useState(false);
  const [esimUsage, setEsimUsage] = useState(null);
  const [loadingEsimUsage, setLoadingEsimUsage] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const router = useRouter();

  // Get current language for RTL detection
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);


  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        console.log('❌ No current user, skipping data fetch');
        return;
      }

      try {
        console.log('🔍 Current user:', currentUser.email);
        
        // Fetch orders from MongoDB API
        console.log('📱 Fetching orders from MongoDB API...');
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
        
        const response = await fetch(`${API_BASE_URL}/api/user/orders`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${currentUser.accessToken || 'dummy-token'}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const ordersData = data.data.orders.map(order => {
            const countryCode = order.countryCode;
            const countryName = order.countryName;
            
            return {
              id: order.id,
              orderId: order.orderId || order.id,
              planName: order.planName || 'Unknown Plan',
              amount: order.amount || 0,
              status: order.status || 'unknown',
              customerEmail: order.customerEmail || currentUser.email,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              // Map country information with translation
              countryCode: countryCode,
              countryName: translateCountryName(countryCode, countryName, locale),
              // Map QR code data
              qrCode: {
                qrCode: order.qrCode,
                qrCodeUrl: order.qrCodeUrl,
                directAppleInstallationUrl: order.directAppleInstallationUrl,
                iccid: order.iccid,
                lpa: order.lpa,
                matchingId: order.matchingId
              }
            };
          });
          
          setOrders(ordersData);
          console.log('✅ Orders loaded from MongoDB API:', ordersData.length);
        } else {
          throw new Error(data.error || 'Failed to fetch orders');
        }
      } catch (error) {
        console.error('❌ Error fetching eSIMs:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        // Set empty orders array on error
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    const ensureUserProfile = async () => {
      if (!currentUser) return;

      try {
        console.log('Checking user profile for:', currentUser.uid);
        // User profile is handled by the MongoDB backend
        console.log('✅ User profile handled by MongoDB backend');
        // Force reload profile in case it wasn't loaded
        await loadUserProfile();
      } catch (error) {
        console.error('❌ Error ensuring user profile:', error);
      }
    };

    ensureUserProfile();
    fetchData();
  }, [currentUser, loadUserProfile]);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loadingDashboard', 'Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!currentUser) {
    return null;
  }

  const activeOrders = orders.filter(order => order && order.status === 'active');


  const handleViewQRCode = async (order) => {
    try {
      setSelectedOrder(order);
      setShowQRModal(true);
      
      // Check if we already have QR code data in the order (multiple formats for compatibility)
      const hasQrCode = order.qrCode && (
        (typeof order.qrCode === 'string' && order.qrCode.length > 0) ||
        (typeof order.qrCode === 'object' && (order.qrCode.qrCode || order.qrCode.qrCodeUrl || order.qrCode.directAppleInstallationUrl))
      );
      
      const hasOtherQrData = order.directAppleInstallationUrl || order.qrCodeUrl || order.iccid;
      
      if (hasQrCode || hasOtherQrData) {
        console.log('✅ Using existing QR code data from order');
        let qrCodeData;
        
        if (typeof order.qrCode === 'object') {
          qrCodeData = order.qrCode;
        } else {
          qrCodeData = {
            qrCode: order.qrCode || order.directAppleInstallationUrl,
            qrCodeUrl: order.qrCodeUrl,
            directAppleInstallationUrl: order.directAppleInstallationUrl,
            iccid: order.iccid,
            lpa: order.lpa,
            matchingId: order.matchingId,
            activationCode: order.activationCode,
            isReal: true
          };
        }
        
        setSelectedOrder(prev => ({ ...prev, qrCode: qrCodeData }));
      } else {
        console.log('⚠️ No existing QR code data, retrieving from API...');
        // Retrieve QR code from API (this will now allow multiple retrievals)
        const qrResult = await generateQRCode(order.orderId || order.id, order.planName);
        setSelectedOrder(prev => ({ ...prev, qrCode: qrResult }));
      }
    } catch (error) {
      console.error('Error opening QR modal:', error);
    }
  };

  const generateQRCode = async (orderId, planName, retryCount = 0) => {
    try {
      // Try to get real QR code from RoamJet API
      console.log(`📱 Attempting to get real QR code for order: ${orderId} (attempt ${retryCount + 1})`);
      
      const qrCodeResult = await esimService.getEsimQrCode(orderId);
      
      if (qrCodeResult.success && qrCodeResult.qrCode) {
        console.log('✅ Real QR code received:', qrCodeResult);
        return {
          qrCode: qrCodeResult.qrCode,
          qrCodeUrl: qrCodeResult.qrCodeUrl,
          directAppleInstallationUrl: qrCodeResult.directAppleInstallationUrl,
          iccid: qrCodeResult.iccid,
          lpa: qrCodeResult.lpa,
          matchingId: qrCodeResult.matchingId,
          activationCode: qrCodeResult.activationCode,
          smdpAddress: qrCodeResult.smdpAddress,
          orderDetails: qrCodeResult.orderDetails,
          simDetails: qrCodeResult.simDetails,
          fromCache: qrCodeResult.fromCache || false,
          canRetrieveMultipleTimes: qrCodeResult.canRetrieveMultipleTimes || false,
          isReal: true
        };
      } else {
        throw new Error('No QR code data received');
      }
    } catch (error) {
      console.log(`⚠️ Real QR code failed (attempt ${retryCount + 1}):`, error.message);
      
      // If this is a "not ready yet" error and we haven't retried too many times, retry
      if (error.message.includes('not available yet') && retryCount < 3) {
        console.log('⏳ QR code not ready, retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generateQRCode(orderId, planName, retryCount + 1);
      }
      
      // Fallback to simple data string
      const qrData = `eSIM:${orderId || 'unknown'}|Plan:${planName || 'unknown'}|Status:Active`;
      return {
        qrCode: qrData,
        isReal: false,
        fallbackReason: error.message,
        canRetry: true
      };
    }
  };

  // Update Firebase order with correct country information
  const updateOrderCountryInfo = async (order, esimDetails) => {
    try {
      console.log('🔄 Updating country info for order:', order.id);
      
        // Extract country info from plan ID using the same logic as PaymentSuccess
        const getCountryFromPlan = (planId) => {
          if (!planId) return null;

          const countryMap = {
            // Comprehensive country mapping from cleaned countries.txt
            'sohbat-mobile': { code: "AF", name: "Afghanistan" },
            'hej-telecom': { code: "AL", name: "Albania" },
            'algecom': { code: "DZ", name: "Algeria" },
            'handi': { code: "AD", name: "Andorra" },
            'dolphin-mobile': { code: "AI", name: "Anguilla" },
            '17-miles': { code: "AG", name: "Antigua And Barbuda" },
            '17miles': { code: "AG", name: "Antigua And Barbuda" },
            'saba-mobile': { code: "AN", name: "Antilles" },
            'abrazo': { code: "AR", name: "Argentina" },
            'arpi-telecom': { code: "AM", name: "Armenia" },
            'noord-communications-in': { code: "AW", name: "Aruba" },
            'yes-go': { code: "AU", name: "Australia" },
            'viennetz-mobil': { code: "AT", name: "Austria" },
            'yaxsi-mobile': { code: "AZ", name: "Azerbaijan" },
            'pico': { code: "PT", name: "Azores" },
            'jitney-mobile': { code: "BS", name: "Bahamas" },
            'saar-mobile': { code: "BH", name: "Bahrain" },
            'fatafati-in': { code: "BD", name: "Bangladesh" },
            'barbnet': { code: "BB", name: "Barbados" },
            'norach-telecom': { code: "BY", name: "Belarus" },
            'belganet': { code: "BE", name: "Belgium" },
            'cho': { code: "BZ", name: "Belize" },
            'cotton-mobile': { code: "BJ", name: "Benin" },
            'bermy-mobile': { code: "BM", name: "Bermuda" },
            'paro': { code: "BT", name: "Bhutan" },
            'wa-mobile': { code: "BO", name: "Bolivia" },
            'hatonet': { code: "BQ", name: "Bonaire" },
            'bosher': { code: "BA", name: "Bosnia and Herzegovina" },
            'maun-telecom': { code: "BW", name: "Botswana" },
            'joia': { code: "BR", name: "Brazil" },
            'muara-mobile': { code: "BN", name: "Brunei" },
            'bultel': { code: "BG", name: "Bulgaria" },
            'volta': { code: "BF", name: "Burkina Faso" },
            'connect-cambodia': { code: "KH", name: "Cambodia" },
            'kamtok-telecom': { code: "CM", name: "Cameroon" },
            'canada-mobile': { code: "CA", name: "Canada" },
            'mansetel': { code: "ES", name: "Canary Islands" },
            'fogotel': { code: "CV", name: "Cape Verde" },
            'atlantis-telecom': { code: "KY", name: "Cayman Islands" },
            'chinko': { code: "CF", name: "Central African Republic" },
            'first-well': { code: "TD", name: "Chad" },
            'altoque': { code: "CL", name: "Chile" },
            'chinacom': { code: "CN", name: "China" },
            'hartonet': { code: "CO", name: "Colombia" },
            'hot-telecom': { code: "CR", name: "Costa Rica" },
            'nouchi-mobile': { code: "CI", name: "Côte d'Ivoire" },
            'cronet': { code: "HR", name: "Croatia" },
            'dushi-mobile': { code: "CW", name: "Curaçao" },
            'dekanet': { code: "CY", name: "Cyprus" },
            'prosim': { code: "CZ", name: "Czech Republic" },
            'hygge-mobile': { code: "DK", name: "Denmark" },
            'djibnet': { code: "DJ", name: "Djibouti" },
            'nature-mobile': { code: "DM", name: "Dominica" },
            'caribe-mobile': { code: "DO", name: "Dominican Republic" },
            'mitad-mobile': { code: "EC", name: "Ecuador" },
            'nile-mobile': { code: "EG", name: "Egypt" },
            'chivo': { code: "SV", name: "El Salvador" },
            'malabo-mobile': { code: "GQ", name: "Equatorial Guinea" },
            'eritcom': { code: "ER", name: "Eritrea" },
            'estonia-mobile': { code: "EE", name: "Estonia" },
            'eswatini-communications': { code: "SZ", name: "Eswatini" },
            'habesha-mobile': { code: "ET", name: "Ethiopia" },
            'bula-mobile': { code: "FJ", name: "Fiji" },
            'suomi-mobile': { code: "FI", name: "Finland" },
            'elan': { code: "FR", name: "France" },
            'okoume-mobile': { code: "GA", name: "Gabon" },
            'teranga-mobile': { code: "GM", name: "Gambia" },
            'kargi': { code: "GE", name: "Georgia" },
            'hallo-mobil': { code: "DE", name: "Germany" },
            'akwaaba-mobile': { code: "GH", name: "Ghana" },
            'meraki-mobile': { code: "GR", name: "Greece" },
            'spice-mobile': { code: "GD", name: "Grenada" },
            'chapin-mobile': { code: "GT", name: "Guatemala" },
            'guinee-mobile': { code: "GN", name: "Guinea" },
            'guinea-bissau-mobile': { code: "GW", name: "Guinea-Bissau" },
            'guyana-mobile': { code: "GY", name: "Guyana" },
            'ayiti-mobile': { code: "HT", name: "Haiti" },
            'catracho-mobile': { code: "HN", name: "Honduras" },
            'hkmobile': { code: "HK", name: "Hong Kong" },
            'magyar-mobile': { code: "HU", name: "Hungary" },
            'island-mobile': { code: "IS", name: "Iceland" },
            'kallur-digital': { code: "IN", name: "India" },
            'indonesia-mobile': { code: "ID", name: "Indonesia" },
            'iran-mobile': { code: "IR", name: "Iran" },
            'iraq-mobile': { code: "IQ", name: "Iraq" },
            'eire-mobile': { code: "IE", name: "Ireland" },
            'isle-of-man-mobile': { code: "IM", name: "Isle of Man" },
            'ahava': { code: "IL", name: "Israel" },
            'mamma-mia': { code: "IT", name: "Italy" },
            'jamaica-mobile': { code: "JM", name: "Jamaica" },
            'moshi-moshi': { code: "JP", name: "Japan" },
            'jersey-mobile': { code: "JE", name: "Jersey" },
            'jordan-mobile': { code: "JO", name: "Jordan" },
            'kazakhstan-mobile': { code: "KZ", name: "Kazakhstan" },
            'kenya-mobile': { code: "KE", name: "Kenya" },
            'kiribati-mobile': { code: "KI", name: "Kiribati" },
            'plisi': { code: "XK", name: "Kosovo" },
            'kuwait-mobile': { code: "KW", name: "Kuwait" },
            'kyrgyzstan-mobile': { code: "KG", name: "Kyrgyzstan" },
            'laos-mobile': { code: "LA", name: "Laos" },
            'latvia-mobile': { code: "LV", name: "Latvia" },
            'lebanon-mobile': { code: "LB", name: "Lebanon" },
            'lesotho-mobile': { code: "LS", name: "Lesotho" },
            'liberia-mobile': { code: "LR", name: "Liberia" },
            'libya-mobile': { code: "LY", name: "Libya" },
            'liechtenstein-mobile': { code: "LI", name: "Liechtenstein" },
            'lithuania-mobile': { code: "LT", name: "Lithuania" },
            'luxembourg-mobile': { code: "LU", name: "Luxembourg" },
            'macau-mobile': { code: "MO", name: "Macau" },
            'madagascar-mobile': { code: "MG", name: "Madagascar" },
            'porto': { code: "PT", name: "Madeira" },
            'malawi-mobile': { code: "MW", name: "Malawi" },
            'sambungkan': { code: "MY", name: "Malaysia" },
            'maldives-mobile': { code: "MV", name: "Maldives" },
            'mali-mobile': { code: "ML", name: "Mali" },
            'malta-mobile': { code: "MT", name: "Malta" },
            'marshall-mobile': { code: "MH", name: "Marshall Islands" },
            'mauritania-mobile': { code: "MR", name: "Mauritania" },
            'mauritius-mobile': { code: "MU", name: "Mauritius" },
            'chido': { code: "MX", name: "Mexico" },
            'micronesia-mobile': { code: "FM", name: "Micronesia" },
            'moldova-mobile': { code: "MD", name: "Moldova" },
            'monaco-mobile': { code: "MC", name: "Monaco" },
            'mongolia-mobile': { code: "MN", name: "Mongolia" },
            'montenegro-mobile': { code: "ME", name: "Montenegro" },
            'morocco-mobile': { code: "MA", name: "Morocco" },
            'mozambique-mobile': { code: "MZ", name: "Mozambique" },
            'myanmar-mobile': { code: "MM", name: "Myanmar" },
            'namibia-mobile': { code: "NA", name: "Namibia" },
            'nauru-mobile': { code: "NR", name: "Nauru" },
            'nepal-mobile': { code: "NP", name: "Nepal" },
            'netherlands-mobile': { code: "NL", name: "Netherlands" },
            'new-zealand-mobile': { code: "NZ", name: "New Zealand" },
            'nicaragua-mobile': { code: "NI", name: "Nicaragua" },
            'niger-mobile': { code: "NE", name: "Niger" },
            'nigeria-mobile': { code: "NG", name: "Nigeria" },
            'north-korea-mobile': { code: "KP", name: "North Korea" },
            'north-macedonia-mobile': { code: "MK", name: "North Macedonia" },
            'adanet': { code: "CY", name: "Northern Cyprus" },
            'norway-mobile': { code: "NO", name: "Norway" },
            'oman-mobile': { code: "OM", name: "Oman" },
            'pakistan-mobile': { code: "PK", name: "Pakistan" },
            'palau-mobile': { code: "PW", name: "Palau" },
            'palestine-mobile': { code: "PS", name: "Palestine" },
            'panama-mobile': { code: "PA", name: "Panama" },
            'papua-new-guinea-mobile': { code: "PG", name: "Papua New Guinea" },
            'paraguay-mobile': { code: "PY", name: "Paraguay" },
            'peru-mobile': { code: "PE", name: "Peru" },
            'philippines-mobile': { code: "PH", name: "Philippines" },
            'poland-mobile': { code: "PL", name: "Poland" },
            'portugal-mobile': { code: "PT", name: "Portugal" },
            'boricua-in-mobile': { code: "PR", name: "Puerto Rico" },
            'qatar-mobile': { code: "QA", name: "Qatar" },
            'romania-mobile': { code: "RO", name: "Romania" },
            'russia-mobile': { code: "RU", name: "Russia" },
            'rwanda-mobile': { code: "RW", name: "Rwanda" },
            'saint-kitts-mobile': { code: "KN", name: "Saint Kitts and Nevis" },
            'saint-lucia-mobile': { code: "LC", name: "Saint Lucia" },
            'tobago': { code: "VC", name: "Saint Vincent and the Grenadines" },
            'faaf-mobile': { code: "WS", name: "Samoa" },
            'san-marino-mobile': { code: "SM", name: "San Marino" },
            'sao-tome-mobile': { code: "ST", name: "Sao Tome and Principe" },
            'red-sand': { code: "SA", name: "Saudi Arabia" },
            'nessietel': { code: "GB", name: "Scotland" },
            'retba-mobile': { code: "SN", name: "Senegal" },
            'serbia-mobile': { code: "RS", name: "Serbia" },
            'laziocom': { code: "SC", name: "Seychelles" },
            'buncenet': { code: "SL", name: "Sierra Leone" },
            'connect-lah': { code: "SG", name: "Singapore" },
            'dobry-den': { code: "SK", name: "Slovakia" },
            'zivjo': { code: "SI", name: "Slovenia" },
            'solomon-mobile': { code: "SB", name: "Solomon Islands" },
            'somalia-mobile': { code: "SO", name: "Somalia" },
            'cellsa': { code: "ZA", name: "South Africa" },
            'jang': { code: "KR", name: "South Korea" },
            'south-sudan-mobile': { code: "SS", name: "South Sudan" },
            'guay-mobile': { code: "ES", name: "Spain" },
            'sri-lanka-mobile': { code: "LK", name: "Sri Lanka" },
            'sudan-mobile': { code: "SD", name: "Sudan" },
            'pondocom': { code: "SR", name: "Suriname" },
            'van': { code: "SE", name: "Sweden" },
            'switzerland-mobile': { code: "CH", name: "Switzerland" },
            'syria-mobile': { code: "SY", name: "Syria" },
            'xie-xie-unlimited': { code: "TW", name: "Taiwan" },
            'sarez-telecom': { code: "TJ", name: "Tajikistan" },
            'tanzacomm': { code: "TZ", name: "Tanzania" },
            'maew': { code: "TH", name: "Thailand" },
            'jaco-mobile': { code: "TL", name: "Timor - Leste" },
            'atakora-mobile': { code: "TG", name: "Togo" },
            'tofua-mobile': { code: "TO", name: "Tonga" },
            'tritocom': { code: "TT", name: "Trinidad and Tobago" },
            'el-jem-communications': { code: "TN", name: "Tunisia" },
            'merhaba': { code: "TR", name: "Turkey" },
            'turkmenistan-mobile': { code: "TM", name: "Turkmenistan" },
            'tuca-mobile': { code: "TC", name: "Turks and Caicos Islands" },
            'tuvalu-mobile': { code: "TV", name: "Tuvalu" },
            'ugish': { code: "UG", name: "Uganda" },
            'ukraine-mobile': { code: "UA", name: "Ukraine" },
            'burj-mobile': { code: "AE", name: "United Arab Emirates" },
            'uki-mobile': { code: "GB", name: "United Kingdom" },
            'change': { code: "US", name: "United States" },
            'ballena': { code: "UY", name: "Uruguay" },
            'uzbeknet': { code: "UZ", name: "Uzbekistan" },
            'efate': { code: "VU", name: "Vanuatu" },
            'ager-in': { code: "VA", name: "Vatican City" },
            'aragua-mobile': { code: "VE", name: "Venezuela" },
            'xin-chao-in': { code: "VN", name: "Vietnam" },
            'magens-mobile-in': { code: "VI", name: "Virgin Islands (U.S.)" },
            'yemen-mobile': { code: "YE", name: "Yemen" },
            'kafue-mobile': { code: "ZM", name: "Zambia" },
            'zimcom': { code: "ZW", name: "Zimbabwe" },
            
            'default': { code: "US", name: "United States" }
          };

          const countryKey = Object.keys(countryMap).find(key => planId.includes(key));
          return countryMap[countryKey] || countryMap.default;
        };
      
      // Get country info from plan ID
      const countryInfo = getCountryFromPlan(order.planId || order.id);
      
      if (!countryInfo) {
        console.log('⚠️ Could not determine country from plan ID:', order.planId);
        return;
      }
      
      // Check if country info needs updating
      const currentCountryCode = order.countryCode;
      const currentCountryName = order.countryName;
      
      if (currentCountryCode === countryInfo.code && currentCountryName === countryInfo.name) {
        console.log('✅ Country info is already correct, no update needed');
        return;
      }
      
      console.log('🔄 Updating country info:', {
        from: { code: currentCountryCode, name: currentCountryName },
        to: { code: countryInfo.code, name: countryInfo.name }
      });
      
      // Update the order via MongoDB API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
      
      const response = await fetch(`${API_BASE_URL}/api/user/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken || 'dummy-token'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCode: countryInfo.code,
          countryName: countryInfo.name,
          countryUpdateReason: 'Corrected from eSIM details check'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? { ...o, countryCode: countryInfo.code, countryName: countryInfo.name }
            : o
        )
      );
      
      console.log('✅ Country info updated successfully');
      toast.success(t('dashboard.countryInfoUpdated', 'Country info updated: {{name}} ({{code}})', { name: countryInfo.name, code: countryInfo.code }), {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      
    } catch (error) {
      console.error('❌ Error updating country info:', error);
      toast.error(t('dashboard.failedToUpdateCountryInfo', 'Failed to update country info: {{error}}', { error: error.message }), {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };


  const handleCheckEsimDetails = async () => {
    if (!selectedOrder || loadingEsimDetails) return;
    
    try {
      setLoadingEsimDetails(true);
      console.log('📊 Checking eSIM details for order:', selectedOrder);
      
      // Get ICCID from the order
      const iccid = selectedOrder.qrCode?.iccid || selectedOrder.iccid;
      
      if (!iccid) {
        console.log('❌ No ICCID found in order');
        alert(t('dashboard.noIccidFound', 'No ICCID found in this order. Cannot check eSIM details.'));
        return;
      }
      
      console.log('📊 Checking eSIM details for ICCID:', iccid);
      const result = await esimService.getEsimDetailsByIccid(iccid);
      
      if (result.success) {
        setEsimDetails(result.data);
        console.log('✅ eSIM details retrieved:', result.data);
        
        // Update country info if needed
        await updateOrderCountryInfo(selectedOrder, result.data);
      } else {
        console.log('❌ Failed to get eSIM details:', result.error);
        alert(t('dashboard.failedToGetEsimDetails', 'Failed to get eSIM details: {{error}}', { error: result.error }));
      }
    } catch (error) {
      console.error('❌ Error checking eSIM details:', error);
      alert(t('dashboard.errorCheckingEsimDetails', 'Error checking eSIM details: {{error}}', { error: error.message }));
    } finally {
      setLoadingEsimDetails(false);
    }
  };

  const handleCheckEsimUsage = async () => {
    if (!selectedOrder || loadingEsimUsage) return;
    
    try {
      setLoadingEsimUsage(true);
      console.log('📊 Checking eSIM usage for order:', selectedOrder);
      
      // Get ICCID from the order
      const iccid = selectedOrder.qrCode?.iccid || selectedOrder.iccid;
      
      if (!iccid) {
        console.log('❌ No ICCID found in order');
        alert(t('dashboard.noIccidFoundUsage', 'No ICCID found in this order. Cannot check eSIM usage.'));
        return;
      }
      
      console.log('📊 Checking eSIM usage for ICCID:', iccid);
      const result = await esimService.getEsimUsageByIccid(iccid);
      
      if (result.success) {
        setEsimUsage(result.data);
        console.log('✅ eSIM usage retrieved:', result.data);
      } else {
        console.log('❌ Failed to get eSIM usage:', result.error);
        alert(t('dashboard.failedToGetEsimUsage', 'Failed to get eSIM usage: {{error}}', { error: result.error }));
      }
    } catch (error) {
      console.error('❌ Error checking eSIM usage:', error);
      alert(t('dashboard.errorCheckingEsimUsage', 'Error checking eSIM usage: {{error}}', { error: error.message }));
    } finally {
      setLoadingEsimUsage(false);
    }
  };

  const handleDeleteOrder = async () => {
    console.log('🔴 Delete button clicked!');
    console.log('🔴 selectedOrder:', selectedOrder);
    console.log('🔴 isRetrying:', isRetrying);
    
    if (!selectedOrder || isRetrying) {
      console.log('🔴 Early return - no selectedOrder or isRetrying');
      return;
    }
    
    try {
      setIsRetrying(true);
      console.log('🗑️ Deleting eSIM order from Firestore...');
      console.log('🗑️ Selected order data:', selectedOrder);
      
      // Get the ICCID and package info before deleting
      const iccid = selectedOrder.esimData?.iccid;
      const packageId = selectedOrder.package_id;
      const orderId = selectedOrder.orderId || selectedOrder.id;
      
      console.log('🗑️ Order details:', { iccid, packageId, orderId });
      
      // Delete the order via MongoDB API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
      
      const response = await fetch(`${API_BASE_URL}/api/user/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken || 'dummy-token'}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      console.log('✅ Order deleted from MongoDB');
      
      // SIM tracking (optional - don't fail if this doesn't work)
      if (iccid && packageId) {
        try {
          console.log('🔄 Marking SIM as available again:', { iccid, packageId });
          
          // SIM tracking is handled by the MongoDB backend
          console.log('✅ SIM tracking handled by MongoDB backend');
        } catch (simError) {
          console.error('⚠️ Failed to mark SIM as available:', simError);
          // Don't fail the delete operation if SIM tracking fails
        }
      } else {
        console.log('⚠️ No ICCID or packageId found, skipping SIM tracking');
      }
      
      // Remove from local state
      setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      setSelectedOrder(null);
      setShowQRModal(false);
      
      console.log('✅ eSIM order deleted from Firestore successfully');
    } catch (error) {
      console.error('❌ Error deleting eSIM order:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      // Show user-friendly error message
      alert(t('dashboard.failedToDeleteOrder', 'Failed to delete order: {{error}}', { error: error.message }));
    } finally {
      setIsRetrying(false);
    }
  };


  return (
    <div className="min-h-screen bg-white py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <DashboardHeader 
        currentUser={currentUser}
        userProfile={userProfile}
      />

      {/* Stats Cards */}
      <StatsCards 
        orders={orders}
        activeOrders={activeOrders}
      />

      {/* Recent Orders */}
      <RecentOrders 
        orders={orders}
        loading={loading}
        onViewQRCode={handleViewQRCode}
      />

      {/* Account Settings */}
      <AccountSettings 
        currentUser={currentUser}
        userProfile={userProfile}
        onLoadUserProfile={loadUserProfile}
      />

      {/* Spacing after dashboard */}
      <div className="h-20"></div>

      {/* QR Code Modal */}
      <QRCodeModal 
        show={showQRModal}
        selectedOrder={selectedOrder}
        onClose={() => setShowQRModal(false)}
        onCheckEsimDetails={handleCheckEsimDetails}
        onCheckEsimUsage={handleCheckEsimUsage}
        onDelete={handleDeleteOrder}
        loadingEsimDetails={loadingEsimDetails}
        loadingEsimUsage={loadingEsimUsage}
      />

      {/* eSIM Details Modal */}
      <EsimDetailsModal 
        esimDetails={esimDetails}
        onClose={() => setEsimDetails(null)}
      />

      {/* eSIM Usage Modal */}
      <EsimUsageModal 
        esimUsage={esimUsage}
        onClose={() => setEsimUsage(null)}
      />
    </div>
  );
};

export default Dashboard;
