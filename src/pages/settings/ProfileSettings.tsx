import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Save, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ProfileSettings: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    timezone: '',
    language: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        timezone: profile.timezone || 'America/New_York',
        language: profile.language || 'en',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const hasAnyChanges =
        formData.display_name !== (profile.display_name || '') ||
        formData.username !== (profile.username || '') ||
        formData.bio !== (profile.bio || '') ||
        formData.timezone !== (profile.timezone || 'America/New_York') ||
        formData.language !== (profile.language || 'en') ||
        formData.phone !== (profile.phone || '');
      setHasChanges(hasAnyChanges);
    }
  }, [formData, profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages on input change
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setHasChanges(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'de', label: 'Deutsch (German)' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#27AE60] hover:text-[#219A52] mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#27AE60] bg-opacity-10 rounded-lg flex items-center justify-center">
              <User className="w-8 h-8 text-[#27AE60]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
            </div>
          </div>

          {/* Current User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#27AE60] bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[#27AE60]" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {profile?.display_name || profile?.username || 'User'}
                  </div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit}>
            {/* Success/Error Message */}
            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  placeholder="Enter your display name"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is how your name will appear to other household members.
                </p>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  placeholder="Enter your username"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your unique identifier. Other users can find you by this username.
                </p>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  placeholder="Tell us a bit about yourself..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional. A brief description about yourself.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional. For account recovery and important notifications.
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Used for displaying dates and times in your local timezone.
                </p>
              </div>

              {/* Language */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Your preferred language for the interface.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div>
                {hasChanges && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    You have unsaved changes
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || isLoading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    hasChanges && !isLoading
                      ? 'bg-[#27AE60] text-white hover:bg-[#219A52]'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow-sm p-8 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Email Address</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>
              <button
                onClick={() => window.location.href = '/settings/account'}
                className="text-[#27AE60] hover:text-[#219A52] text-sm font-medium"
              >
                Change Email →
              </button>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Password</div>
                <div className="text-sm text-gray-600">••••••••</div>
              </div>
              <button
                onClick={() => window.location.href = '/settings/account'}
                className="text-[#27AE60] hover:text-[#219A52] text-sm font-medium"
              >
                Change Password →
              </button>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <div className="font-medium text-gray-900">Account Created</div>
                <div className="text-sm text-gray-600">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;