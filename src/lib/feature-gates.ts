import { getUserHousehold } from './auth-utils';

/**
 * Feature Gate Definitions based on SUBSCRIPTION_TIERS.md
 */

export interface FeatureLimits {
  maxSavingsGoals: number | null;
  maxTransactionMonths: number | null;
  maxHouseholdMembers: number | null;
  canUseOCR: boolean;
  canCreateCustomCategories: boolean;
  canTrackBills: boolean;
  canExportData: boolean;
  canViewAdvancedReports: boolean;
  canEditAsHouseholdMember: boolean;
  canAccessUnlimitedHistory: boolean;
}

/**
 * Get feature limits based on subscription status
 * Premium features only for: trialing, active, past_due WITH stripe_customer_id
 */
export async function getFeatureLimits(): Promise<FeatureLimits> {
  const household = await getUserHousehold();

  // Must have Stripe customer ID for premium access
  const hasStripeCustomer = !!(household.stripe_customer_id && household.stripe_customer_id.length > 0);
  const validPremiumStatus = ['active', 'trialing', 'past_due'].includes(household.subscription_status || '');
  const isPremium = validPremiumStatus && hasStripeCustomer;

  if (isPremium) {
    return {
      maxSavingsGoals: null, // Unlimited
      maxTransactionMonths: null, // Unlimited
      maxHouseholdMembers: null, // Unlimited
      canUseOCR: true,
      canCreateCustomCategories: true,
      canTrackBills: true,
      canExportData: true,
      canViewAdvancedReports: true,
      canEditAsHouseholdMember: true,
      canAccessUnlimitedHistory: true,
    };
  }

  // Free tier limits
  return {
    maxSavingsGoals: 2,
    maxTransactionMonths: 2,
    maxHouseholdMembers: 4, // 1 owner + 3 read-only
    canUseOCR: false,
    canCreateCustomCategories: false,
    canTrackBills: false,
    canExportData: false,
    canViewAdvancedReports: false,
    canEditAsHouseholdMember: false, // Read-only for non-owners
    canAccessUnlimitedHistory: false,
  };
}

/**
 * Check if a specific feature is available
 */
export async function canUseFeature(feature: keyof FeatureLimits): Promise<boolean> {
  const limits = await getFeatureLimits();
  const value = limits[feature];

  if (typeof value === 'boolean') {
    return value;
  }

  // For numeric limits, null means unlimited (premium)
  return value === null;
}

/**
 * Check if user has hit savings goal limit
 */
export async function canCreateSavingsGoal(currentGoalCount: number): Promise<boolean> {
  const limits = await getFeatureLimits();

  if (limits.maxSavingsGoals === null) {
    return true; // Premium - unlimited
  }

  return currentGoalCount < limits.maxSavingsGoals;
}

/**
 * Check if user can view transactions from a specific date
 */
export async function canViewTransactionDate(transactionDate: Date): Promise<boolean> {
  const limits = await getFeatureLimits();

  if (limits.maxTransactionMonths === null) {
    return true; // Premium - unlimited history
  }

  const monthsAgo = Math.floor(
    (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return monthsAgo <= limits.maxTransactionMonths;
}

/**
 * Check if user can edit as a household member
 */
export async function canEditAsHouseholdMember(): Promise<boolean> {
  const household = await getUserHousehold();

  // Owners can always edit
  if (household.role === 'owner' || household.role === 'admin') {
    return true;
  }

  // For other members, check if premium
  const limits = await getFeatureLimits();
  return limits.canEditAsHouseholdMember;
}

/**
 * Get user-friendly message for feature restriction
 */
export function getFeatureRestrictionMessage(feature: keyof FeatureLimits): string {
  const messages: Record<keyof FeatureLimits, string> = {
    maxSavingsGoals: 'Upgrade to Premium for unlimited savings goals (Free tier: max 2)',
    maxTransactionMonths: 'Upgrade to Premium for unlimited transaction history (Free tier: 2 months)',
    maxHouseholdMembers: 'Upgrade to Premium for unlimited household members (Free tier: max 4)',
    canUseOCR: 'OCR receipt scanning is a Premium feature',
    canCreateCustomCategories: 'Custom categories are a Premium feature',
    canTrackBills: 'Bills and subscriptions tracking is a Premium feature',
    canExportData: 'Data export is a Premium feature',
    canViewAdvancedReports: 'Advanced reports are a Premium feature',
    canEditAsHouseholdMember: 'Editing permissions for household members is a Premium feature',
    canAccessUnlimitedHistory: 'Unlimited transaction history is a Premium feature',
  };

  return messages[feature];
}