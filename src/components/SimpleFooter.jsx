'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LogIn, Mail, Smartphone, HelpCircle, LayoutDashboard } from 'lucide-react';

export default function SimpleFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { currentUser, logout } = useAuth();
  
  // Get language prefix from pathname
  const langMatch = pathname.match(/^\/(ar|de|es|fr|he|ru)(?:\/|$)/);
  const langPrefix = langMatch ? `/${langMatch[1]}` : '';
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a 
              href="https://esim.roamjet.net/device-compatibility"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <Smartphone size={16} />
              <span className="md:hidden">{t('navbar.deviceCompatibility', 'Compat')}</span>
              <span className="hidden md:inline">{t('navbar.deviceCompatibility', 'Compatibility')}</span>
            </a>
            <a 
              href="https://esim.roamjet.net/faq"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <HelpCircle size={16} />
              {t('navbar.faq', 'FAQ')}
            </a>
          </div>
          
          {/* Right side - User info and Login/Logout */}
          <div className="flex items-center gap-4">
            {/* Dashboard Button (only show when logged in) */}
            {currentUser && (
              <Link
                href={`${langPrefix}/dashboard`}
                className="flex items-center justify-center text-sm text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                title={t('navbar.dashboard', 'Dashboard')}
              >
                <LayoutDashboard size={16} />
                <span className="ml-1">{t('navbar.dashboard', 'Dashboard')}</span>
              </Link>
            )}
            
            {/* User Information */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={16} />
                  <span>{currentUser.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center text-sm text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                  title={t('navbar.logout', 'Logout')}
                >
                  <LogOut size={16} />
                  <span className="ml-1">{t('navbar.logout', 'Logout')}</span>
                </button>
              </div>
            ) : (
              <Link 
                href={`${langPrefix}/login`}
                className="flex items-center justify-center text-sm text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                title={t('navbar.login', 'Login')}
              >
                <LogIn size={16} />
                <span className="ml-1">{t('navbar.login', 'Login')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}