'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, Save, Settings, Key, DollarSign, Globe, Users, Search, Edit2, Shield, UserCheck, UserX, X, ShoppingBag, Trash2, Download } from 'lucide-react';
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
    googleSecret: '',
    googleAuthEnabled: false,
    yandexAppId: '',
    yandexAppSecret: '',
    yandexAuthEnabled: false,
    roamjetApiKey: '',
    roamjetMode: 'sandbox',
    robokassaMerchantLogin: '',
    robokassaPassOne: '',
    robokassaPassTwo: '',
    robokassaMode: 'test',
    discountPercentage: 0,
    usdToRubRate: 100
  });
  
  const [showPasswords, setShowPasswords] = useState({
    googleSecret: false,
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
  const [selectedUserOrders, setSelectedUserOrders] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadConfig = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // Check if already authenticated
    const sessionAuth = sessionStorage.getItem('configAuthenticated');
    if (sessionAuth === 'true') {
      setAuthenticated(true);
      loadConfig();
    }
  }, [loadConfig]);

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

  const handleViewUserOrders = async (user) => {
    setSelectedUserOrders(user);
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams();
      if (user._id) params.append('userId', user._id);
      if (user.email) params.append('email', user.email);
      
      const response = await fetch(`/api/users/orders?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUserOrders(data.orders || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading user orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.displayName || user.email}"? This will delete all their orders and eSIMs.`)) {
      return;
    }

    setUsersLoading(true);
    try {
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('User deleted successfully');
        loadUsers();
        loadUserStats();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!confirm(`Are you sure you want to delete this order?`)) {
      return;
    }

    setOrdersLoading(true);
    try {
      const response = await fetch('/api/orders/delete-by-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order._id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Order deleted successfully');
        // Reload orders for the current user
        if (selectedUserOrders) {
          handleViewUserOrders(selectedUserOrders);
        }
      } else {
        toast.error(data.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleDownloadPrices = () => {
    const url = 'https://bucket.roamjet.net/uploads/report.csv';
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prices-report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Prices report downloaded');
  };

  useEffect(() => {
    if (authenticated && activeTab === 'users') {
      loadUsers();
      loadUserStats();
    }
  }, [authenticated, activeTab, currentPage, searchQuery, roleFilter, loadUsers, loadUserStats]);

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
            <div className="flex items-center gap-3">
              {activeTab === 'users' && (
                <button
                  onClick={handleDownloadPrices}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download size={18} />
                  Download Prices Report
                </button>
              )}
              <button
                onClick={() => handleChangePassword()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Key size={18} />
                Change Password
              </button>
            </div>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Google Client Secret</label>
                  <div className="relative">
                    <input
                      type={showPasswords.googleSecret ? 'text' : 'password'}
                      value={config.googleSecret}
                      onChange={(e) => setConfig({...config, googleSecret: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Google OAuth Client Secret"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('googleSecret')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.googleSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                <div>
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

          {/* Pricing Section */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Pricing Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Discount Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={config.discountPercentage}
                  onChange={(e) => setConfig({...config, discountPercentage: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Global discount percentage for all plans (0-100)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">USD to RUB Exchange Rate</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.usdToRubRate}
                  onChange={(e) => setConfig({...config, usdToRubRate: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.00"
                />
                <p className="text-xs text-gray-500 mt-1">Current exchange rate for USD to Russian Ruble</p>
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
            {/* Filters and Search */}
            <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
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
                        <tr 
                          key={user._id} 
                          className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                          onClick={() => handleViewUserOrders(user)}
                        >
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
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                              user.provider === 'google' ? 'bg-red-500/20' :
                              user.provider === 'yandex' ? 'bg-yellow-500/20' :
                              'bg-gray-500/20'
                            } text-white`}>
                              {user.provider}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
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

        {/* User Orders Modal */}
        {selectedUserOrders && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Orders for {selectedUserOrders.displayName || selectedUserOrders.email}
                    </h2>
                    <p className="text-sm text-gray-400">{selectedUserOrders.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserOrders(null);
                    setUserOrders([]);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto p-6">
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <p className="mt-4 text-gray-400">Loading orders...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">No orders found</div>
                    <div className="text-gray-500 text-sm">This user hasn't placed any orders yet</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div
                        key={order._id}
                        className="bg-gray-700/30 border border-gray-600 rounded-xl p-4 hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white mb-1">
                              {order.description || order.packageId}
                            </div>
                            <div className="text-xs text-gray-400">Order ID: {order.orderId}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">
                                {order.amount} {order.currency}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(order);
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className="text-gray-400 mb-1">Status</div>
                            <div className={`px-2 py-1 rounded-full inline-block ${
                              order.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              order.status === 'processing' ? 'bg-blue-500/20 text-blue-300' :
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                              order.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {order.status}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Payment</div>
                            <div className={`px-2 py-1 rounded-full inline-block ${
                              order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-300' :
                              order.paymentStatus === 'failed' ? 'bg-red-500/20 text-red-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {order.paymentStatus}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Quantity</div>
                            <div className="text-white">{order.quantity}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Date</div>
                            <div className="text-white">{formatDate(order.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

