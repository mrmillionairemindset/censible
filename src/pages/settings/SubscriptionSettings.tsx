import React, { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Users, Target, CreditCard, Calendar, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createCustomerPortalSession, createHouseholdCheckoutSession, hasPremiumAccess, SUBSCRIPTION_PLANS } from '../../lib/stripe-utils';
import { getHouseholdMembers, getHouseholdStats } from '../../lib/auth-utils';
import toast from 'react-hot-toast';

interface UsageStats {
  memberCount: number;
  savingsGoalCount: number;
  maxMembers: number;
  maxSavingsGoals: number;
}

const SubscriptionSettings: React.FC = () => {
  const { user, household, refreshHousehold } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    memberCount: 0,
    savingsGoalCount: 0,
    maxMembers: 1,
    maxSavingsGoals: 2
  });

  useEffect(() => {
    const loadData = async () => {
      if (user && household?.household_id) {
        // Check premium access
        const access = await hasPremiumAccess();
        setHasAccess(access);

        // Load usage stats
        try {
          const members = await getHouseholdMembers();
          const stats = await getHouseholdStats(household.household_id);

          setUsageStats({
            memberCount: members.length,
            savingsGoalCount: stats.savingsGoalCount || 0,
            maxMembers: household.subscription_status === 'active' || household.subscription_status === 'trialing' ? 10 : 4,
            maxSavingsGoals: household.subscription_status === 'active' || household.subscription_status === 'trialing' ? 20 : 3
          });
        } catch (error) {
          console.error('Error loading usage stats:', error);
        }
      }
    };
    loadData();
  }, [user, household]);

  const handleManageSubscription = async () => {
    if (!hasAccess) return;

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

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await createHouseholdCheckoutSession(
        `${window.location.origin}/dashboard?subscription=success`,
        window.location.href
      );
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start upgrade process');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '✓ Active';
      case 'trialing':
        return '⏱ Trial';
      case 'past_due':
        return '⚠ Payment Due';
      case 'cancelled':
        return '✗ Cancelled';
      default:
        return 'Free';
    }
  };

  const isPremium = hasAccess && (household?.subscription_status === 'active' || household?.subscription_status === 'trialing');
  // Only show manage button if user has actual Stripe subscription
  const hasStripeSubscription = (household?.stripe_customer_id || household?.stripe_subscription_id) &&
    (household?.subscription_status === 'active' || household?.subscription_status === 'past_due');
  // Trial users without Stripe should see upgrade button
  const isTrialWithoutStripe = household?.subscription_status === 'trialing' && !household?.stripe_customer_id;
  const plan = SUBSCRIPTION_PLANS.premium_household;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
              <p className="text-gray-600 mt-1">Manage your plan and billing information</p>
            </div>
          </div>

          {/* Current Plan Status */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isPremium ? 'Premium Household' : 'Free Plan'}
                </h3>
                <p className="text-gray-600">
                  {isPremium
                    ? 'Full access to all household features'
                    : 'Basic budgeting with limited features'
                  }
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                getStatusColor(household?.subscription_status || 'free')
              }`}>
                {getStatusText(household?.subscription_status || 'free')}
              </span>
            </div>

            {/* Trial Notice */}
            {household?.subscription_status === 'trialing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Trial Period Active</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {household?.stripe_customer_id ?
                        "Your trial will convert to a paid subscription automatically. Click 'Manage Trial' above to cancel anytime before the trial ends." :
                        "You're enjoying premium features for free! No credit card on file, so you won't be charged. To continue with premium features after the trial, upgrade above."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Past Due Notice */}
            {household?.subscription_status === 'past_due' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Payment Required</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your payment is past due. Please update your payment method to continue using premium features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {hasStripeSubscription ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#27AE60] text-white rounded-lg hover:bg-[#219A52] disabled:opacity-50 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  {loading ? 'Loading...' : 'Manage Billing'}
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  {loading ? 'Loading...' : isTrialWithoutStripe ? 'Activate Premium Trial' : 'Upgrade to Premium'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Usage & Limits */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Usage & Limits</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Household Members */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Household Members</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {usageStats.memberCount}/{usageStats.maxMembers}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    usageStats.memberCount >= usageStats.maxMembers
                      ? 'bg-red-500'
                      : usageStats.memberCount / usageStats.maxMembers > 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((usageStats.memberCount / usageStats.maxMembers) * 100, 100)}%`
                  }}
                ></div>
              </div>

              <p className="text-sm text-gray-600">
                {usageStats.memberCount < usageStats.maxMembers
                  ? `${usageStats.maxMembers - usageStats.memberCount} slots remaining`
                  : 'At member limit'
                }
              </p>
            </div>

            {/* Savings Goals */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Savings Goals</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {usageStats.savingsGoalCount}/{usageStats.maxSavingsGoals}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    usageStats.savingsGoalCount >= usageStats.maxSavingsGoals
                      ? 'bg-red-500'
                      : usageStats.savingsGoalCount / usageStats.maxSavingsGoals > 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((usageStats.savingsGoalCount / usageStats.maxSavingsGoals) * 100, 100)}%`
                  }}
                ></div>
              </div>

              <p className="text-sm text-gray-600">
                {usageStats.savingsGoalCount < usageStats.maxSavingsGoals
                  ? `${usageStats.maxSavingsGoals - usageStats.savingsGoalCount} goals remaining`
                  : 'At goals limit'
                }
              </p>
            </div>
          </div>

          {/* Upgrade Prompt for Free Users */}
          {!isPremium && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Unlock More with Premium</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Up to 10 household members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Up to 20 savings goals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>24 months of budget history</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Receipt scanning with OCR</span>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Upgrade Now - ${(plan.price / 100).toFixed(2)}/month
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Plan Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Plan Comparison</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Free Plan</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">$0<span className="text-sm font-normal text-gray-600">/month</span></p>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Personal budgeting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Up to 4 household members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Up to 3 savings goals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>2 months budget history</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Basic transaction tracking</span>
                </li>
              </ul>
            </div>

            {/* Premium Plan */}
            <div className={`border-2 rounded-lg p-6 ${isPremium ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Premium Household</h3>
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${(plan.price / 100).toFixed(2)}<span className="text-sm font-normal text-gray-600">/month</span>
                </p>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Up to 10 household members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Up to 20 savings goals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>24 months budget history</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Receipt scanning with OCR</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Priority customer support</span>
                </li>
              </ul>

              {isPremium && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    ✓ Current Plan
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>All payments are securely processed by Stripe • Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettings;