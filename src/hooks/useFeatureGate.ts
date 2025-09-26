import { useState, useEffect } from 'react';
import {
  FeatureLimits,
  getFeatureLimits,
  canUseFeature,
  getFeatureRestrictionMessage
} from '../lib/feature-gates';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to check feature availability and get limits
 */
export function useFeatureGate() {
  const { household } = useAuth();
  const [limits, setLimits] = useState<FeatureLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLimits() {
      try {
        const featureLimits = await getFeatureLimits();
        setLimits(featureLimits);
      } catch (error) {
        console.error('Error loading feature limits:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLimits();
  }, [household]); // Reload when household changes

  /**
   * Check if a specific feature is available
   */
  const isFeatureEnabled = async (feature: keyof FeatureLimits): Promise<boolean> => {
    return canUseFeature(feature);
  };

  /**
   * Get restriction message for a feature
   */
  const getRestrictionMessage = (feature: keyof FeatureLimits): string => {
    return getFeatureRestrictionMessage(feature);
  };

  /**
   * Check if subscription is premium
   * Premium features only for: trialing, active, past_due WITH stripe_customer_id
   */
  const isPremium = (): boolean => {
    if (!household) return false;

    const hasStripeCustomer = !!(household.stripe_customer_id && household.stripe_customer_id.length > 0);
    const validPremiumStatus = ['active', 'trialing', 'past_due'].includes(household.subscription_status || '');

    return validPremiumStatus && hasStripeCustomer;
  };

  /**
   * Check if user can edit (owner/admin or premium member)
   */
  const canEdit = (): boolean => {
    if (household?.role === 'owner' || household?.role === 'admin') {
      return true;
    }
    // Regular members can edit only if premium
    return isPremium() && limits?.canEditAsHouseholdMember === true;
  };

  return {
    limits,
    loading,
    isFeatureEnabled,
    getRestrictionMessage,
    isPremium: isPremium(),
    canEdit: canEdit(),
  };
}