-- Add billing period tracking fields to households table
-- These fields will help track when subscriptions/trials end for cancelled accounts

ALTER TABLE households
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

ALTER TABLE households
ADD COLUMN IF NOT EXISTS access_ends_at TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN households.cancel_at_period_end IS 'True if subscription is set to cancel at the end of current billing period';
COMMENT ON COLUMN households.access_ends_at IS 'Final date when premium access expires (for cancelled subscriptions/trials)';
COMMENT ON COLUMN households.trial_ends_at IS 'When trial period ends (for trial accounts)';
COMMENT ON COLUMN households.subscription_current_period_end IS 'When current billing period ends (for active subscriptions)';
COMMENT ON COLUMN households.subscription_canceled_at IS 'When cancellation was requested (not when access ends)';

-- Update any existing cancelled subscriptions to set access_ends_at
-- For cancelled active subscriptions, access ends at current period end
UPDATE households
SET access_ends_at = subscription_current_period_end
WHERE subscription_status = 'cancelled'
  AND subscription_current_period_end IS NOT NULL
  AND access_ends_at IS NULL;

-- For cancelled trials, access ends at trial end
UPDATE households
SET access_ends_at = trial_ends_at
WHERE subscription_status = 'cancelled'
  AND trial_ends_at IS NOT NULL
  AND subscription_current_period_end IS NULL
  AND access_ends_at IS NULL;