import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Calendar, Receipt, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createCustomerPortalSession, hasPremiumAccess, SUBSCRIPTION_PLANS } from '../../lib/stripe-utils';
import toast from 'react-hot-toast';

const BillingSettings: React.FC = () => {
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

  const isPremium = hasAccess && (household?.subscription_status === 'active' || household?.subscription_status === 'trialing');
  // Only show manage button if user has actual Stripe subscription
  const hasStripeSubscription = (household?.stripe_customer_id || household?.stripe_subscription_id) &&
    (household?.subscription_status === 'active' || household?.subscription_status === 'past_due' || household?.subscription_status === 'trialing');
  const isTrialWithoutStripe = household?.subscription_status === 'trialing' && !household?.stripe_customer_id;
  const plan = SUBSCRIPTION_PLANS.premium_household;

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
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
              <p className="text-gray-600 mt-1">Manage your payment methods and view billing history</p>
            </div>
          </div>
        </div>

        {/* Current Subscription */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Subscription</h2>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isPremium ? 'Premium Household' : 'Free Plan'}
                </h3>
                <p className="text-gray-600">
                  {isPremium
                    ? `$${(plan.price / 100).toFixed(2)} per month`
                    : 'No subscription fees'
                  }
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                household?.subscription_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : household?.subscription_status === 'trialing'
                  ? 'bg-blue-100 text-blue-800'
                  : household?.subscription_status === 'past_due'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {household?.subscription_status === 'active' && '✓ Active'}
                {household?.subscription_status === 'trialing' && '⏱ Trial'}
                {household?.subscription_status === 'past_due' && '⚠ Payment Due'}
                {!household?.subscription_status && 'Free'}
              </span>
            </div>

            {/* Billing Status Messages */}
            {household?.subscription_status === 'trialing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Free Trial Active</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {household?.stripe_customer_id ?
                        "Your trial includes all premium features. Click 'Manage Trial' above to cancel anytime before the trial ends to avoid charges." :
                        "You're enjoying premium features for free! No credit card on file, so you won't be charged."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {household?.subscription_status === 'past_due' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Payment Overdue</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your subscription payment is overdue. Please update your payment method to restore premium features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {household?.subscription_status === 'active' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Subscription Active</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your subscription is active and all features are available.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {hasStripeSubscription && (
              <div className="flex gap-3">
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#219A52] disabled:opacity-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {loading ? 'Loading...' : household?.subscription_status === 'trialing' ? 'Manage Trial (Cancel anytime)' : 'Manage in Stripe Portal'}
                </button>
              </div>
            )}
          </div>

          {!isPremium && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">You're currently on the free plan.</p>
              <button
                onClick={() => window.location.href = '/settings/subscription'}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Subscription Options →
              </button>
            </div>
          )}
        </div>

        {/* Billing Management */}
        {hasStripeSubscription && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Management</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Payment Methods</div>
                    <div className="text-sm text-gray-600">View and update your payment methods</div>
                  </div>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="text-[#27AE60] hover:text-[#219A52] text-sm font-medium"
                >
                  Manage →
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Billing History</div>
                    <div className="text-sm text-gray-600">Download invoices and view past payments</div>
                  </div>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="text-[#27AE60] hover:text-[#219A52] text-sm font-medium"
                >
                  View History →
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Subscription Settings</div>
                    <div className="text-sm text-gray-600">Change plans or cancel subscription</div>
                  </div>
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="text-[#27AE60] hover:text-[#219A52] text-sm font-medium"
                >
                  Manage →
                </button>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 text-center">
                All billing operations are handled securely through Stripe.
                You'll be redirected to the Stripe Customer Portal to make changes.
              </p>
            </div>
          </div>
        )}

        {/* Security & Privacy */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Security & Privacy</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">PCI DSS Compliant</div>
                <div className="text-sm text-gray-600 mt-1">
                  All payment information is processed securely through Stripe, which is PCI DSS Level 1 certified.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">No Stored Payment Data</div>
                <div className="text-sm text-gray-600 mt-1">
                  Centsible never stores your credit card information. All payment data is handled by Stripe.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Secure Connections</div>
                <div className="text-sm text-gray-600 mt-1">
                  All communications between your device and our servers are encrypted using SSL/TLS.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;