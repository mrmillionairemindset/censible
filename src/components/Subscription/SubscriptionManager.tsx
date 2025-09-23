import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { createCustomerPortalSession, getSubscriptionStatus, hasPremiumAccess } from '../../lib/stripe-utils';
import toast from 'react-hot-toast';

const SubscriptionManager: React.FC = () => {
  const { user, household } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const access = await hasPremiumAccess();
        setHasAccess(access);
      }
    };
    checkAccess();
  }, [user, household]);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const returnUrl = window.location.href;
      const portalUrl = await createCustomerPortalSession(returnUrl);
      window.location.href = portalUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal');
      setLoading(false);
    }
  };

  if (!user || !household?.household_id) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Subscription Management
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Premium Household</h3>
            <p className="text-sm text-gray-600">
              Shared budgets for family members
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            household.subscription_status === 'active'
              ? 'bg-green-100 text-green-800'
              : household.subscription_status === 'trialing'
              ? 'bg-blue-100 text-blue-800'
              : household.subscription_status === 'past_due'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {household.subscription_status === 'active' && '✓ Active'}
            {household.subscription_status === 'trialing' && '⏱ Trial'}
            {household.subscription_status === 'past_due' && '⚠ Payment Due'}
            {household.subscription_status === 'cancelled' && '✗ Cancelled'}
          </span>
        </div>

        {household.subscription_status === 'trialing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Trial Period</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Your trial will convert to a paid subscription automatically.
                  You can cancel anytime before the trial ends.
                </p>
              </div>
            </div>
          </div>
        )}

        {household.subscription_status === 'past_due' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Payment Required</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your payment is past due. Please update your payment method to continue using premium features.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-mint-600 border border-transparent rounded-lg hover:bg-mint-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </div>
            ) : (
              'Manage Billing'
            )}
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Billing managed securely by Stripe
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;