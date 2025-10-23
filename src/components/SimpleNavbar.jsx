'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, LogIn } from 'lucide-react';

export default function SimpleNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { currentUser, logout } = useAuth();
  
  // Get language prefix from pathname
  const langMatch = pathname.match(/^\/(ar|de|es|fr|he|ru)\//);
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">ESIM PLANS</h1>
          </div>
          
          {/* Right side - User info and Language */}
          <div className="flex items-center gap-4">
            {/* User Information */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span className="hidden sm:inline">{currentUser.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center text-sm text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                href={`${langPrefix}/login`}
                className="flex items-center justify-center text-sm text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                title="Login"
              >
                <LogIn size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

