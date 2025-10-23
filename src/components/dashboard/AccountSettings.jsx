import React, { useState, useEffect } from 'react';
import { Settings, Edit3, User, Mail, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';
import { usePathname } from 'next/navigation';

const AccountSettings = ({ currentUser, userProfile, onLoadUserProfile }) => {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  
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
  
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state when user data changes
  useEffect(() => {
    setNewName(currentUser?.displayName || userProfile?.displayName || '');
  }, [currentUser, userProfile]);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error(t('dashboard.nameCannotBeEmpty', 'Name cannot be empty'));
      return;
    }

    setIsUpdating(true);
    try {
      const userId = currentUser.id || currentUser.uid || currentUser._id;
      console.log('🔍 Updating name for user:', userId, 'New name:', newName.trim());
      
      // Update user profile via local API
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          updates: {
            displayName: newName.trim()
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update name');
      }

      // Update local user data and refresh the display
      if (typeof onLoadUserProfile === 'function') {
        await onLoadUserProfile();
      }
      
      // Force update the local state to show the new name immediately
      setNewName(newName.trim());
      
      setEditingName(false);
      toast.success(t('dashboard.nameUpdatedSuccessfully', 'Name updated successfully'));
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error(t('dashboard.failedToUpdateName', 'Failed to update name'));
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelNameEdit = () => {
    setNewName(currentUser?.displayName || '');
    setEditingName(false);
  };

  return (
    <section className="bg-white py-16 account-settings" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} mb-8`}>
                <Settings className="w-6 h-6 text-tufts-blue" />
                <h2 className={`text-2xl font-medium tracking-tight text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.accountSettings', 'Account Settings')}
                </h2>
              </div>
              
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className={`text-lg font-medium text-eerie-black mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('dashboard.personalInformation', 'Personal Information')}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        <Mail className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('dashboard.emailAddress', 'Email Address')}
                      </label>
                      <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-eerie-black">{currentUser.email}</span>
                        <span className="text-xs text-cool-black bg-gray-200 px-2 py-1 rounded">
                          {t('dashboard.verified', 'Verified')}
                        </span>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        <User className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('dashboard.displayName', 'Display Name')}
                      </label>
                      {editingName ? (
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className={`flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                            placeholder={t('dashboard.enterYourName', 'Enter your name')}
                            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                          />
                          <button
                            onClick={handleUpdateName}
                            disabled={isUpdating}
                            className="p-3 bg-tufts-blue text-white rounded-lg hover:bg-cobalt-blue transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelNameEdit}
                            className="p-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-eerie-black">{newName || currentUser.displayName || userProfile?.displayName || t('dashboard.notSet', 'Not set')}</span>
                          <button
                            onClick={() => setEditingName(true)}
                            className="text-tufts-blue hover:text-cobalt-blue transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
        </div>
      </div>
    </section>
  );
};

export default AccountSettings;
