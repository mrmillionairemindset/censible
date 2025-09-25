import { supabase } from './supabaseClient';
import { getUserHousehold } from './auth-utils';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const STRIPE_PRICE_HOUSEHOLD = process.env.REACT_APP_STRIPE_PRICE_HOUSEHOLD; // Premium household price ID

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // In cents
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  premium_household: {
    id: 'premium_household',
    name: 'Premium Household',
    description: 'Share budgets with family members',
    price: 999, // $9.99
    currency: 'usd',
    interval: 'month',
    features: [
      'Household shared budgets',
      'Up to 2 adults + unlimited kids',
      'Real-time sync across devices',
      'Transaction audit trail',
      'Premium customer support'
    ]
  }
};

/**
 * Initialize Stripe checkout session for household subscription
 */
export async function createHouseholdCheckoutSession(successUrl: string, cancelUrl: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user already has a household subscription
  const household = await getUserHousehold();
  if (household.household_id && household.subscription_status === 'active') {
    throw new Error('User already has an active household subscription');
  }

  const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!
    },
    body: JSON.stringify({
      priceId: STRIPE_PRICE_HOUSEHOLD,
      successUrl,
      cancelUrl,
      userId: user.id,
      planType: 'premium_household'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const { sessionId, url } = await response.json();
  return { sessionId, url };
}

/**
 * Create Stripe customer portal session for subscription management
 */
export async function createCustomerPortalSession(returnUrl: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const household = await getUserHousehold();
  if (!household.household_id) {
    throw new Error('User does not have a household subscription');
  }

  const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY!
    },
    body: JSON.stringify({
      userId: user.id,
      returnUrl
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  const { url } = await response.json();
  return url;
}

/**
 * Get subscription status for current user
 */
export async function getSubscriptionStatus() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

/**
 * Check if user has access to premium features
 */
export async function hasPremiumAccess(): Promise<boolean> {
  const household = await getUserHousehold();

  if (!household.household_id) {
    return false;
  }

  return household.subscription_status === 'active' || household.subscription_status === 'trialing';
}

/**
 * Redirect to Stripe checkout
 */
export function redirectToCheckout(sessionId: string) {
  if (!window.Stripe) {
    throw new Error('Stripe not loaded');
  }

  const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY!);
  return stripe.redirectToCheckout({ sessionId });
}

/**
 * Load Stripe script
 */
export function loadStripe(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.Stripe) {
      resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY!));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY!));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Extend window interface for Stripe
declare global {
  interface Window {
    Stripe: any;
  }
}