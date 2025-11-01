'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Save, Settings, Key, DollarSign, Database, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfigPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Config fields
  const [config, setConfig] = useState({
    googleId: '',
    yandexAppId: '',
    yandexAppSecret: '',
    roamjetApiKey: '',
    mongodbUri: '',
    robokassaMerchantLogin: '',
    robokassaPassOne: '',
    robokassaPassTwo: '',
    robokassaMode: 'test',
    stripePublishableKey: '',
    stripeSecretKey: '',
    emailServiceUrl: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    yandexAppSecret: false,
    roamjetApiKey: false,
    robokassaPassOne: false,
    robokassaPassTwo: false,
    stripeSecretKey: false,
    mongodbUri: false
  });

  useEffect(() => {
    // Check if already authenticated
    const sessionAuth = sessionStorage.getItem('configAuthenticated');
    if (sessionAuth === 'true') {
      setAuthenticated(true);
      loadConfig();
    }
  }, []);

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Settings className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Configuration</h1>
                <p className="text-gray-400">Manage system settings and API credentials</p>
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

        {/* Config Sections */}
        <div className="space-y-6">
          {/* Authentication Section */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Authentication</h2>
            </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Service URL</label>
                <input
                  type="text"
                  value={config.emailServiceUrl}
                  onChange={(e) => setConfig({...config, emailServiceUrl: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email Service API URL"
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Payment Gateways</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Publishable Key</label>
                  <input
                    type="text"
                    value={config.stripePublishableKey}
                    onChange={(e) => setConfig({...config, stripePublishableKey: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Secret Key</label>
                  <div className="relative">
                    <input
                      type={showPasswords.stripeSecretKey ? 'text' : 'password'}
                      value={config.stripeSecretKey}
                      onChange={(e) => setConfig({...config, stripeSecretKey: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="sk_test_..."
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('stripeSecretKey')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.stripeSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              
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

          {/* Database Section */}
          <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Database</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">MongoDB URI</label>
              <div className="relative">
                <input
                  type={showPasswords.mongodbUri ? 'text' : 'password'}
                  value={config.mongodbUri}
                  onChange={(e) => setConfig({...config, mongodbUri: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="mongodb://..."
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('mongodbUri')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPasswords.mongodbUri ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={() => loadConfig()}
              disabled={loading}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reload
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-8">
          Configuration stored in MongoDB. Falls back to environment variables if not set.
        </p>
      </div>
    </div>
  );
}

