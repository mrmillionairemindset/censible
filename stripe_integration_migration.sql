-- Stripe Integration Migration
-- Add tables needed for Stripe subscription management
-- Created: 2025-09-25

-- ============================================================================
-- 1. ADD STRIPE FIELDS TO EXISTING TABLES
-- ============================================================================

-- Add Stripe customer ID to households table
ALTER TABLE households
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMPTZ;

-- Add indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_households_stripe_customer_id ON households(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_households_stripe_subscription_id ON households(stripe_subscription_id);

-- ============================================================================
-- 2. CREATE STRIPE_EVENTS TABLE (Webhook tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT false,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Index for webhook processing
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type_processed ON stripe_events(event_type, processed);

-- ============================================================================
-- 3. CREATE SUBSCRIPTION_USAGE_TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Usage metrics
    member_count INTEGER DEFAULT 0,
    savings_goals_count INTEGER DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One record per household per day
    UNIQUE(household_id, usage_date)
);

-- Indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_household_date ON subscription_usage_tracking(household_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON subscription_usage_tracking(usage_date);

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get current usage stats for a household
CREATE OR REPLACE FUNCTION get_household_usage_stats(household_uuid UUID)
RETURNS JSON AS $$
DECLARE
    member_count INTEGER;
    savings_count INTEGER;
    result JSON;
BEGIN
    -- Get member count
    SELECT COUNT(*) INTO member_count
    FROM household_members
    WHERE household_id = household_uuid;

    -- Get savings goals count (handle missing table gracefully)
    BEGIN
        SELECT COUNT(*) INTO savings_count
        FROM savings_goals
        WHERE household_id = household_uuid;
    EXCEPTION WHEN undefined_table THEN
        savings_count := 0;
    END;

    -- Build result
    result := json_build_object(
        'member_count', member_count,
        'savings_goals_count', savings_count,
        'last_updated', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update household subscription from Stripe webhook
CREATE OR REPLACE FUNCTION update_household_subscription(
    stripe_customer_id_param VARCHAR(255),
    subscription_status_param VARCHAR(50),
    stripe_subscription_id_param VARCHAR(255) DEFAULT NULL,
    current_period_start_param TIMESTAMPTZ DEFAULT NULL,
    current_period_end_param TIMESTAMPTZ DEFAULT NULL,
    canceled_at_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE households
    SET
        subscription_status = subscription_status_param,
        stripe_subscription_id = COALESCE(stripe_subscription_id_param, stripe_subscription_id),
        subscription_current_period_start = COALESCE(current_period_start_param, subscription_current_period_start),
        subscription_current_period_end = COALESCE(current_period_end_param, subscription_current_period_end),
        subscription_canceled_at = COALESCE(canceled_at_param, subscription_canceled_at),
        updated_at = NOW()
    WHERE stripe_customer_id = stripe_customer_id_param;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to log Stripe webhook events (idempotent)
CREATE OR REPLACE FUNCTION log_stripe_event(
    stripe_event_id_param VARCHAR(255),
    event_type_param VARCHAR(100),
    event_data_param JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO stripe_events (stripe_event_id, event_type, data, processed)
    VALUES (stripe_event_id_param, event_type_param, event_data_param, false)
    ON CONFLICT (stripe_event_id) DO NOTHING;

    -- Return true if event was newly inserted or already exists
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Stripe events - only service role can access (for webhook processing)
CREATE POLICY "Service role can manage stripe events" ON stripe_events
    FOR ALL USING (auth.role() = 'service_role');

-- Usage tracking - users can view their household's usage
CREATE POLICY "Users can view their household usage" ON subscription_usage_tracking
    FOR SELECT USING (
        household_id IN (
            SELECT household_id
            FROM household_members
            WHERE user_id = auth.uid()
        )
    );

-- Service role can manage usage tracking
CREATE POLICY "Service role can manage usage tracking" ON subscription_usage_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

-- Grant permissions for new tables
GRANT SELECT ON stripe_events TO service_role;
GRANT INSERT, UPDATE ON stripe_events TO service_role;

GRANT SELECT ON subscription_usage_tracking TO authenticated;
GRANT ALL ON subscription_usage_tracking TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_household_usage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_household_subscription(VARCHAR, VARCHAR, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION log_stripe_event(VARCHAR, VARCHAR, JSONB) TO service_role;

-- ============================================================================
-- 7. UPDATE EXISTING DATA
-- ============================================================================

-- Set default subscription status for existing households
UPDATE households
SET subscription_status = 'free'
WHERE subscription_status IS NULL;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'households'
AND column_name LIKE '%stripe%' OR column_name LIKE '%subscription%';

-- Verify new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('stripe_events', 'subscription_usage_tracking');

-- Verify functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
    'get_household_usage_stats',
    'update_household_subscription',
    'log_stripe_event'
);

-- Test usage stats function
SELECT get_household_usage_stats(
    (SELECT household_id FROM household_members WHERE user_id = auth.uid() LIMIT 1)
);

-- Success message
SELECT 'Stripe Integration Migration Completed Successfully!' as status;