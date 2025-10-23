'use client';

import { useI18n } from '../contexts/I18nContext';

export default function SimpleFooter() {
  const { t } = useI18n();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a 
              href="https://esim.roamjet.net/device-compatibility"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <span className="md:hidden">{t('navbar.deviceCompatibility', 'Compat')}</span>
              <span className="hidden md:inline">{t('navbar.deviceCompatibility', 'Compatibility')}</span>
            </a>
            <a 
              href="https://esim.roamjet.net/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <span className="md:hidden">{t('navbar.privacyPolicy', 'Privacy')}</span>
              <span className="hidden md:inline">{t('navbar.privacyPolicy', 'Privacy')}</span>
            </a>
            <a 
              href="https://esim.roamjet.net/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <span className="md:hidden">{t('navbar.termsOfService', 'Terms')}</span>
              <span className="hidden md:inline">{t('navbar.termsOfService', 'Terms')}</span>
            </a>
            <a 
              href="https://esim.roamjet.net/faq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              {t('navbar.faq', 'FAQ')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}