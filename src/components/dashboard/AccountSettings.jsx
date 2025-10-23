import React, { useState } from 'react';
import { Settings, Edit3, Key, Phone, User, Mail, Save, X } from 'lucide-react';
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
  const [editingPhone, setEditingPhone] = useState(false);
  const [newName, setNewName] = useState(currentUser?.displayName || '');
  const [newPhone, setNewPhone] = useState(userProfile?.phoneNumber || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error(t('dashboard.nameCannotBeEmpty', 'Name cannot be empty'));
      return;
    }

    setIsUpdating(true);
    try {
      // Update user profile via MongoDB API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
      
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken || 'dummy-token'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: newName.trim()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update name');
      }

      await onLoadUserProfile();
      setEditingName(false);
      toast.success(t('dashboard.nameUpdatedSuccessfully', 'Name updated successfully'));
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error(t('dashboard.failedToUpdateName', 'Failed to update name'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePhone = async () => {
    setIsUpdating(true);
    try {
      // Update user profile via MongoDB API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
      
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken || 'dummy-token'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: newPhone.trim()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update phone number');
      }

      await onLoadUserProfile();
      setEditingPhone(false);
      toast.success('Phone number updated successfully');
    } catch (error) {
      console.error('Error updating phone:', error);
      toast.error('Failed to update phone number');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsSendingReset(true);
    try {
      // Send password reset via MongoDB API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
      
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Password reset failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send password reset email');
      }
      
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setIsSendingReset(false);
    }
  };

  const cancelNameEdit = () => {
    setNewName(currentUser?.displayName || '');
    setEditingName(false);
  };

  const cancelPhoneEdit = () => {
    setNewPhone(userProfile?.phoneNumber || '');
    setEditingPhone(false);
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
                          <span className="text-eerie-black">{currentUser.displayName || t('dashboard.notSet', 'Not set')}</span>
                          <button
                            onClick={() => setEditingName(true)}
                            className="text-tufts-blue hover:text-cobalt-blue transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        <Phone className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('dashboard.phoneNumber', 'Phone Number')}
                      </label>
                      {editingPhone ? (
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className={`flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                            placeholder={t('dashboard.enterYourPhone', 'Enter your phone number')}
                            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                          />
                          <button
                            onClick={handleUpdatePhone}
                            disabled={isUpdating}
                            className="p-3 bg-tufts-blue text-white rounded-lg hover:bg-cobalt-blue transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelPhoneEdit}
                            className="p-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-eerie-black">{userProfile?.phoneNumber || t('dashboard.notSet', 'Not set')}</span>
                          <button
                            onClick={() => setEditingPhone(true)}
                            className="text-tufts-blue hover:text-cobalt-blue transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Account Info */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('dashboard.accountCreated', 'Account Created')}
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-eerie-black">
                          {userProfile?.createdAt ? 
                            (userProfile.createdAt.toDate ? 
                              new Date(userProfile.createdAt.toDate()).toLocaleDateString() :
                              new Date(userProfile.createdAt).toLocaleDateString()
                            ) : 
                            t('dashboard.unknown', 'Unknown')
                          }
                        </span>
                        {!userProfile?.createdAt && (
                          <button 
                            onClick={async () => {
                              console.log('Manual refresh triggered');
                              await onLoadUserProfile();
                            }}
                            className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-tufts-blue hover:text-cobalt-blue underline transition-colors`}
                          >
                            {t('dashboard.refresh', 'Refresh')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h3 className={`text-lg font-medium text-eerie-black mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('dashboard.security', 'Security')}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        <Key className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('dashboard.password', 'Password')}
                      </label>
                      <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-eerie-black">••••••••</span>
                        <button
                          onClick={handlePasswordReset}
                          disabled={isSendingReset}
                          className="text-sm bg-tufts-blue text-white px-4 py-2 rounded-lg hover:bg-cobalt-blue transition-colors disabled:opacity-50"
                        >
                          {isSendingReset ? t('dashboard.sending', 'Sending...') : t('dashboard.resetPassword', 'Reset Password')}
                        </button>
                      </div>
                      <p className={`text-xs text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('dashboard.passwordResetInfo', "We'll send a password reset link to your email address")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-sm font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('dashboard.accountRole', 'Account Role')}
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-eerie-black capitalize">
                          {t(`dashboard.roles.${userProfile?.role || 'customer'}`, userProfile?.role || 'customer')}
                        </span>
                      </div>
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
