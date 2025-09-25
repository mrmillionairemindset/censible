import React, { useState } from 'react';
import { ArrowLeft, Shield, Mail, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailForm, setEmailForm] = useState({
    newEmail: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({ ...prev, [name]: value }));
    if (emailMessage) setEmailMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (passwordMessage) setPasswordMessage(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.newEmail.trim()) return;

    setIsLoadingEmail(true);
    setEmailMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      });

      if (error) throw error;

      setEmailMessage({
        type: 'success',
        text: 'Verification email sent to your new address. Please check your email to confirm the change.'
      });
      setEmailForm({ newEmail: '' });
    } catch (error: any) {
      console.error('Email update error:', error);
      setEmailMessage({
        type: 'error',
        text: error.message || 'Failed to update email. Please try again.'
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'New password must be different from current password.' });
      return;
    }

    setIsLoadingPassword(true);
    setPasswordMessage(null);

    try {
      // First verify current password by attempting to re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect.');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) throw updateError;

      setPasswordMessage({
        type: 'success',
        text: 'Password updated successfully.'
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Password update error:', error);
      setPasswordMessage({
        type: 'error',
        text: error.message || 'Failed to update password. Please try again.'
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '' };

    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength++;
    else feedback.push('at least 8 characters');

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('uppercase letter');

    if (/[a-z]/.test(password)) strength++;
    else feedback.push('lowercase letter');

    if (/\d/.test(password)) strength++;
    else feedback.push('number');

    if (/[^A-Za-z\d]/.test(password)) strength++;
    else feedback.push('special character');

    const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-blue-600', 'text-green-600'][strength];

    return {
      strength,
      text: strengthText,
      color: strengthColor,
      feedback: feedback.length > 0 ? `Needs: ${feedback.join(', ')}` : 'Password meets all requirements'
    };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

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
              <Shield className="w-8 h-8 text-[#27AE60]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Security</h1>
              <p className="text-gray-600 mt-1">Manage your email and password</p>
            </div>
          </div>

          {/* Current Account Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Current Email</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Change Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-[#27AE60]" />
            <h2 className="text-xl font-semibold text-gray-900">Change Email Address</h2>
          </div>

          <form onSubmit={handleEmailSubmit}>
            {/* Email Message */}
            {emailMessage && (
              <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                emailMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {emailMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{emailMessage.text}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  id="newEmail"
                  name="newEmail"
                  value={emailForm.newEmail}
                  onChange={handleEmailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                  placeholder="Enter new email address"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  You'll receive a verification email at your new address. Your email will not change until you confirm it.
                </p>
              </div>

              <button
                type="submit"
                disabled={!emailForm.newEmail.trim() || isLoadingEmail}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  emailForm.newEmail.trim() && !isLoadingEmail
                    ? 'bg-[#27AE60] text-white hover:bg-[#219A52]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Mail className="w-4 h-4" />
                {isLoadingEmail ? 'Sending...' : 'Update Email'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-[#27AE60]" />
            <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            {/* Password Message */}
            {passwordMessage && (
              <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {passwordMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{passwordMessage.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordForm.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                      <span className="text-gray-500">{passwordForm.newPassword.length}/8+ chars</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          passwordStrength.strength === 0 ? 'bg-red-500 w-1/5' :
                          passwordStrength.strength === 1 ? 'bg-orange-500 w-2/5' :
                          passwordStrength.strength === 2 ? 'bg-yellow-500 w-3/5' :
                          passwordStrength.strength === 3 ? 'bg-blue-500 w-4/5' :
                          'bg-green-500 w-full'
                        }`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#27AE60] focus:border-transparent ${
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword ||
                  isLoadingPassword
                }
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  passwordForm.currentPassword &&
                  passwordForm.newPassword &&
                  passwordForm.confirmPassword &&
                  passwordForm.newPassword === passwordForm.confirmPassword &&
                  !isLoadingPassword
                    ? 'bg-[#27AE60] text-white hover:bg-[#219A52]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                {isLoadingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;