'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, Save, Settings, Key, DollarSign, Globe, Users, Search, Edit2, Shield, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Config fields
  const [config, setConfig] = useState({
    googleId: '',
    googleAuthEnabled: false,
    yandexAppId: '',
    yandexAppSecret: '',
    yandexAuthEnabled: false,
    roamjetApiKey: '',
    roamjetMode: 'sandbox',
    robokassaMerchantLogin: '',
    robokassaPassOne: '',
    robokassaPassTwo: '',
    robokassaMode: 'test'
  });
  
  const [showPasswords, setShowPasswords] = useState({
    yandexAppSecret: false,
    roamjetApiKey: false,
    robokassaPassOne: false,
    robokassaPassTwo: false
  });

  // Users management state
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, customers: 0, admins: 0, businesses: 0 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    // Check if already authenticated
    const sessionAuth = sessionStorage.getItem('configAuthenticated');
    if (sessionAuth === 'true') {
      setAuthenticated(true);
      loadConfig();
    }
  }, []);

  useEffect(() => {
    if (authenticated && activeTab === 'users') {
      loadUsers();
      loadUserStats();
    }
  }, [authenticated, activeTab, currentPage, searchQuery, roleFilter, loadUsers, loadUserStats]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/config/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (data.success && data.authenticated) {
        setAuthenticated(true);
        sessionStorage.setItem('configAuthenticated', 'true');
        setPassword('');
        toast.success('Login successful');
        loadConfig();
      } else {
        toast.error('Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/get');
      const data = await response.json();
      
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Configuration saved successfully');
      } else {
        toast.error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const oldPassword = prompt('Enter current password:');
    if (!oldPassword) return;
    
    const newPassword = prompt('Enter new password:');
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/config/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Password updated successfully');
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // User management functions
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      
      const response = await fetch(`/api/users/list?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter]);

  const loadUserStats = useCallback(async () => {
    try {
      const response = await fetch('/api/users/stats');
      const data = await response.json();
      
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, []);

  const handleUpdateUser = async (user) => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('User updated successfully');
        setEditingUser(null);
        loadUsers();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    await handleUpdateUser({ userId: user._id, isActive: !user.isActive });
  };

  const handleRoleChange = async (user, newRole) => {
    await handleUpdateUser({ userId: user._id, role: newRole });
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin Configuration</h2>
            <p className="text-gray-400">Enter password to access</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            Default password: 123456
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Settings className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                <p className="text-gray-400">Manage system settings and users</p>
              </div>
            </div>
            <button
              onClick={() => handleChangePassword()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Key size={18} />
              Change Password
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="inline-block mr-2" size={18} />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Users className="inline-block mr-2" size={18} />
            Users
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'settings' && (
          <>
            {/* Config Sections */}
        <div className="space-y-6">
          {/* Authentication Section */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Authentication</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Google Client ID</label>
                  <input
                    type="text"
                    value={config.googleId}
                    onChange={(e) => setConfig({...config, googleId: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Google OAuth Client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yandex App ID</label>
                  <input
                    type="text"
                    value={config.yandexAppId}
                    onChange={(e) => setConfig({...config, yandexAppId: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Yandex OAuth App ID"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yandex App Secret</label>
                  <div className="relative">
                    <input
                      type={showPasswords.yandexAppSecret ? 'text' : 'password'}
                      value={config.yandexAppSecret}
                      onChange={(e) => setConfig({...config, yandexAppSecret: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Yandex OAuth App Secret"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('yandexAppSecret')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.yandexAppSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Auth Toggles */}
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div>
                      <div className="text-sm font-medium text-white">Google Auth</div>
                      <div className="text-xs text-gray-400">Enable Google OAuth login</div>
                    </div>
                    <button
                      onClick={() => setConfig({...config, googleAuthEnabled: !config.googleAuthEnabled})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.googleAuthEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.googleAuthEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div>
                      <div className="text-sm font-medium text-white">Yandex Auth</div>
                      <div className="text-xs text-gray-400">Enable Yandex OAuth login</div>
                    </div>
                    <button
                      onClick={() => setConfig({...config, yandexAuthEnabled: !config.yandexAuthEnabled})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.yandexAuthEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.yandexAuthEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">API Keys</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Roamjet API Key</label>
                <div className="relative">
                  <input
                    type={showPasswords.roamjetApiKey ? 'text' : 'password'}
                    value={config.roamjetApiKey}
                    onChange={(e) => setConfig({...config, roamjetApiKey: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Roamjet API Key"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('roamjetApiKey')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.roamjetApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Roamjet Mode Switcher */}
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div>
                  <div className="text-sm font-medium text-white">Roamjet Mode</div>
                  <div className="text-xs text-gray-400">Switch between Sandbox and Production</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${config.roamjetMode === 'sandbox' ? 'text-yellow-300' : 'text-gray-400'}`}>
                    Sandbox
                  </span>
                  <button
                    onClick={() => setConfig({...config, roamjetMode: config.roamjetMode === 'sandbox' ? 'production' : 'sandbox'})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.roamjetMode === 'production' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.roamjetMode === 'production' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-medium ${config.roamjetMode === 'production' ? 'text-blue-300' : 'text-gray-400'}`}>
                    Production
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">API Base URL:</span><br />
                  {config.roamjetMode === 'production' ? (
                    <code className="text-blue-300">https://api.roamjet.net</code>
                  ) : (
                    <code className="text-yellow-300">https://sandbox.roamjet.net</code>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Robokassa</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Robokassa Merchant Login</label>
                <input
                  type="text"
                  value={config.robokassaMerchantLogin}
                  onChange={(e) => setConfig({...config, robokassaMerchantLogin: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Robokassa Merchant ID"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Robokassa Pass One</label>
                  <div className="relative">
                    <input
                      type={showPasswords.robokassaPassOne ? 'text' : 'password'}
                      value={config.robokassaPassOne}
                      onChange={(e) => setConfig({...config, robokassaPassOne: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Robokassa Password 1"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('robokassaPassOne')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.robokassaPassOne ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Robokassa Pass Two</label>
                  <div className="relative">
                    <input
                      type={showPasswords.robokassaPassTwo ? 'text' : 'password'}
                      value={config.robokassaPassTwo}
                      onChange={(e) => setConfig({...config, robokassaPassTwo: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Robokassa Password 2"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('robokassaPassTwo')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.robokassaPassTwo ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Robokassa Mode</label>
                <select
                  value={config.robokassaMode}
                  onChange={(e) => setConfig({...config, robokassaMode: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="test">Test</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-8">
          Configuration stored in MongoDB. Falls back to environment variables if not set.
        </p>
          </>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-xl">
                <div className="text-gray-400 text-sm mb-1">Total Users</div>
                <div className="text-2xl font-bold text-white">{userStats.total}</div>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-xl">
                <div className="text-gray-400 text-sm mb-1">Active</div>
                <div className="text-2xl font-bold text-green-400">{userStats.active}</div>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-xl">
                <div className="text-gray-400 text-sm mb-1">Customers</div>
                <div className="text-2xl font-bold text-blue-400">{userStats.customers}</div>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-xl">
                <div className="text-gray-400 text-sm mb-1">Admins</div>
                <div className="text-2xl font-bold text-purple-400">{userStats.admins}</div>
              </div>
              <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-xl">
                <div className="text-gray-400 text-sm mb-1">Business</div>
                <div className="text-2xl font-bold text-yellow-400">{userStats.businesses}</div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by email or name..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="customer">Customers</option>
                  <option value="admin">Admins</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {usersLoading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                          Loading users...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{user.displayName || 'N/A'}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              className="px-3 py-1 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="customer">Customer</option>
                              <option value="admin">Admin</option>
                              <option value="business">Business</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.provider === 'google' ? 'bg-red-500/20 text-red-300' :
                              user.provider === 'yandex' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {user.provider}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                user.isActive
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => setEditingUser(editingUser?._id === user._id ? null : user)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {editingUser?._id === user._id ? <UserX size={18} /> : <Edit2 size={18} />}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-700/50 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

