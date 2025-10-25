import React from 'react';
import { Globe, ShoppingBag, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';

const StatsCards = ({ orders }) => {
  const { t, locale } = useI18n();
  const pathname = usePathname();
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

  return (
    <section className="bg-[#1a202c] py-8 stats-card" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Go to Plans Call-to-Action Card */}
          <div className="relative cursor-pointer group" onClick={() => router.push('/')}>
            <div className="absolute inset-px rounded-xl bg-gray-800/90 backdrop-blur-md"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className={`text-lg font-medium text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.browseEsimPlans', 'Browse eSIM Plans')}
                    </p>
                    <p className={`text-2xl font-bold text-blue-400 mt-2 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? (
                        <>
                          {t('dashboard.viewPlans', 'View Plans')}
                          <ArrowRight className="w-6 h-6 text-blue-400 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-6 h-6 text-blue-400 mr-2 group-hover:translate-x-1 transition-transform" />
                          {t('dashboard.viewPlans', 'View Plans')}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-gray-700/50"></div>
          </div>

          {/* Total Orders Card */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-gray-800/90 backdrop-blur-md"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className={`text-lg font-medium text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.totalOrders', 'Total Orders')}
                    </p>
                    <p className={`text-2xl font-bold text-white mt-2 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? (
                        <>
                          {orders.length}
                          <Globe className="w-6 h-6 text-blue-400 ml-2" />
                        </>
                      ) : (
                        <>
                          <Globe className="w-6 h-6 text-blue-400 mr-2" />
                          {orders.length}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-gray-700/50"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCards;
