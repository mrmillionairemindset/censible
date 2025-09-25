-- Settings Foundation Migration
-- Phase 0: Database Foundation for User Settings System
-- Created: 2025-09-25

-- ============================================================================
-- 1. EXTEND PROFILES TABLE
-- Add missing fields needed for user settings
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_timezone ON profiles(timezone);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language);

-- ============================================================================
-- 2. CREATE USER_PREFERENCES TABLE
-- Store UI preferences, themes, and display settings per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- UI Preferences
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    accent_color VARCHAR(20) DEFAULT 'mint',
    typography_scale VARCHAR(20) DEFAULT 'cozy' CHECK (typography_scale IN ('compact', 'cozy', 'roomy')),
    contrast VARCHAR(20) DEFAULT 'normal' CHECK (contrast IN ('normal', 'high')),
    reduce_motion BOOLEAN DEFAULT false,

    -- Notification Preferences (basic)
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,

    -- Display Preferences
    currency_format VARCHAR(10) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    number_format VARCHAR(10) DEFAULT 'US',

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON user_preferences(theme);

-- ============================================================================
-- 3. CREATE AUDIT_LOGS TABLE
-- Track important account changes and login activity
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,

    -- Action Details
    action VARCHAR(100) NOT NULL, -- 'login', 'password_change', 'email_change', 'profile_update', etc.
    category VARCHAR(50) DEFAULT 'account' CHECK (category IN ('account', 'security', 'profile', 'settings', 'subscription')),

    -- Context
    details JSONB, -- Store additional context about the action
    ip_address INET,
    user_agent TEXT,

    -- Results
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_household_id_created_at ON audit_logs(household_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- Functions to manage preferences and audit logging
-- ============================================================================

-- Function to create default user preferences when user signs up
CREATE OR REPLACE FUNCTION create_default_user_preferences(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_preferences (user_id, theme, notifications_enabled, email_notifications)
    VALUES (user_uuid, 'light', true, true)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    user_uuid UUID,
    action_name VARCHAR(100),
    household_uuid UUID DEFAULT NULL,
    action_category VARCHAR(50) DEFAULT 'account',
    action_details JSONB DEFAULT NULL,
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL,
    action_success BOOLEAN DEFAULT true,
    error_msg TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, household_id, action, category, details,
        ip_address, user_agent, success, error_message
    )
    VALUES (
        user_uuid, household_uuid, action_name, action_category, action_details,
        client_ip, client_user_agent, action_success, error_msg
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. UPDATE EXISTING TRIGGER FOR NEW USERS
-- Ensure new users get default preferences
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON profiles;

-- Create updated trigger that also creates preferences
CREATE OR REPLACE FUNCTION handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default preferences for new user
    PERFORM create_default_user_preferences(NEW.id);

    -- Log the account creation
    PERFORM log_audit_event(
        NEW.id,
        'account_created',
        NULL,
        'account',
        jsonb_build_object(
            'username', NEW.username,
            'email', NEW.email
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user preference creation
CREATE TRIGGER on_auth_user_created_preferences
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_preferences();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own preferences and audit logs
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Preferences Policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit Logs Policies (read-only for users, system can insert)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- System/service role can insert audit logs (for server-side logging)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- Ensure authenticated users can access the new tables
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- Test that the migration worked correctly
-- ============================================================================

-- Check that profiles table has new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('bio', 'timezone', 'language', 'phone');

-- Check that new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_preferences', 'audit_logs');

-- Check that functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('create_default_user_preferences', 'log_audit_event');

-- Success message
SELECT 'Settings Foundation Migration Completed Successfully!' as status;