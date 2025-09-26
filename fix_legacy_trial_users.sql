-- Fix legacy trial users who have 'trialing' status but no Stripe customer ID
-- These users should be on the free plan per our new policy

UPDATE households
SET
  subscription_status = 'free',
  plan_type = 'free'
WHERE
  subscription_status = 'trialing'
  AND (stripe_customer_id IS NULL OR stripe_customer_id = '');

-- Show what was updated
SELECT
  household_name,
  subscription_status,
  plan_type,
  CASE
    WHEN stripe_customer_id IS NULL OR stripe_customer_id = ''
    THEN 'No Stripe ID'
    ELSE 'Has Stripe ID'
  END as stripe_status
FROM households
WHERE subscription_status = 'free' OR subscription_status = 'trialing';