import React from 'react';
import { ArrowLeft, User, Shield, Bell, CreditCard, Settings as SettingsIcon, Palette, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SettingsHome: React.FC = () => {
  const { user, profile, household } = useAuth();

  const settingsCategories = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your personal information and preferences',
      icon: User,
      path: '/settings/profile',
      color: 'bg-blue-100 text-blue-600',
      available: true
    },
    {
      id: 'account',
      title: 'Account',
      description: 'Email, password, and account security',
      icon: Shield,
      path: '/settings/account',
      color: 'bg-green-100 text-green-600',
      available: true
    },
    {
      id: 'subscription',
      title: 'Subscription',
      description: 'Manage your plan and billing',
      icon: Crown,
      path: '/settings/subscription',
      color: 'bg-purple-100 text-purple-600',
      available: true
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your app experience',
      icon: Palette,
      path: '/settings/preferences',
      color: 'bg-pink-100 text-pink-600',
      available: household?.subscription_tier === 'premium'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control how you receive updates',
      icon: Bell,
      path: '/settings/notifications',
      color: 'bg-yellow-100 text-yellow-600',
      available: household?.subscription_tier === 'premium'
    },
    {
      id: 'billing',
      title: 'Billing',
      description: 'Payment methods and invoices',
      icon: CreditCard,
      path: '/settings/billing',
      color: 'bg-indigo-100 text-indigo-600',
      available: true
    }
  ];

  const isPremium = household?.subscription_tier === 'premium';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#27AE60] hover:text-[#219A52] mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#27AE60] bg-opacity-10 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-[#27AE60]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>

          {/* User Info Quick Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#27AE60] bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#27AE60]" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {profile?.display_name || profile?.username || 'User'}
                  </div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isPremium
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isPremium ? (
                    <>
                      <Crown className="w-4 h-4 mr-1" />
                      Premium
                    </>
                  ) : (
                    'Free'
                  )}
                </div>
                {household?.household_name && (
                  <div className="text-sm text-gray-600 mt-1">{household.household_name}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            const isAvailable = category.available;

            return (
              <div key={category.id} className="relative">
                <button
                  onClick={() => {
                    if (isAvailable) {
                      window.location.href = category.path;
                    }
                  }}
                  disabled={!isAvailable}
                  className={`w-full bg-white rounded-lg shadow-sm p-6 text-left transition-all ${
                    isAvailable
                      ? 'hover:shadow-md hover:scale-105 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      {!isAvailable && (
                        <div className="flex items-center gap-1 mt-1">
                          <Crown className="w-3 h-3 text-purple-600" />
                          <span className="text-xs text-purple-600 font-medium">Premium</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </button>
              </div>
            );
          })}
        </div>

        {/* Premium Upgrade Prompt */}
        {!isPremium && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Unlock Premium Features</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Get access to advanced preferences, notifications, security features, and more household members.
                </p>
                <button
                  onClick={() => window.location.href = '/settings/subscription'}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/help'}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-1">Get Help</div>
              <div className="text-sm text-gray-600">Browse help articles</div>
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-1">Contact Support</div>
              <div className="text-sm text-gray-600">Get personalized help</div>
            </button>
            <button
              onClick={() => window.location.href = '/about'}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-1">About Centsible</div>
              <div className="text-sm text-gray-600">App info and version</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsHome;