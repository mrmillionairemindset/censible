-- =============================================
-- TARGETED HOUSEHOLD MIGRATION
-- Purpose: Update existing schema to match our subscription model
-- Date: 2025-09-24
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Update households table to match our model
-- =============================================

-- Add missing columns to existing households table
DO $$
BEGIN
  -- Add name column (alias to household_name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'name'
  ) THEN
    ALTER TABLE households ADD COLUMN name VARCHAR(255);
    -- Copy data from household_name to name
    UPDATE households SET name = household_name WHERE name IS NULL;
  END IF;

  -- Add subscription_tier column (standardized)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE households ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
    -- Map existing plan_type to subscription_tier
    UPDATE households SET subscription_tier =
      CASE
        WHEN plan_type = 'premium' OR plan_type = 'pro' THEN 'premium'
        ELSE 'free'
      END;
  END IF;

  -- Add subscription_expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE households ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add max_members
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE households ADD COLUMN max_members INTEGER DEFAULT 4;
  END IF;

  -- Add max_savings_goals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'max_savings_goals'
  ) THEN
    ALTER TABLE households ADD COLUMN max_savings_goals INTEGER DEFAULT 2;
  END IF;

  -- Add data_retention_months
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'data_retention_months'
  ) THEN
    ALTER TABLE households ADD COLUMN data_retention_months INTEGER DEFAULT 2;
  END IF;
END $$;

-- =============================================
-- STEP 2: Ensure household_id is populated in income_sources
-- =============================================

-- Populate household_id from user's household membership
UPDATE income_sources i
SET household_id = hm.household_id
FROM household_members hm
WHERE i.user_id = hm.user_id
AND i.household_id IS NULL;

-- Add is_shared column for personal vs household income
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_sources' AND column_name = 'is_shared'
  ) THEN
    ALTER TABLE income_sources ADD COLUMN is_shared BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- =============================================
-- STEP 3: Update transactions table (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'transactions'
  ) THEN
    -- Add household_id to transactions
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'household_id'
    ) THEN
      ALTER TABLE transactions ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;

    -- Populate household_id from the user's household membership
    UPDATE transactions t
    SET household_id = hm.household_id
    FROM household_members hm
    WHERE t.user_id = hm.user_id
    AND t.household_id IS NULL;

    -- Add is_shared column for personal vs household expenses
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'transactions' AND column_name = 'is_shared'
    ) THEN
      ALTER TABLE transactions ADD COLUMN is_shared BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;
END $$;

-- =============================================
-- STEP 4: Update savings_goals table (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'savings_goals'
  ) THEN
    -- Add household_id to savings_goals
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'savings_goals' AND column_name = 'household_id'
    ) THEN
      ALTER TABLE savings_goals ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;

    -- Populate household_id from the user's household membership
    UPDATE savings_goals s
    SET household_id = hm.household_id
    FROM household_members hm
    WHERE s.user_id = hm.user_id
    AND s.household_id IS NULL;

    -- Add is_shared column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'savings_goals' AND column_name = 'is_shared'
    ) THEN
      ALTER TABLE savings_goals ADD COLUMN is_shared BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;
END $$;

-- =============================================
-- STEP 5: Enhance household_members table
-- =============================================

-- Add missing columns for better family management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'household_members' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE household_members ADD COLUMN display_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'household_members' AND column_name = 'spending_limit'
  ) THEN
    ALTER TABLE household_members ADD COLUMN spending_limit DECIMAL(10,2);
  END IF;
END $$;

-- Update roles to include 'child' option
ALTER TABLE household_members
DROP CONSTRAINT IF EXISTS household_members_role_check;

ALTER TABLE household_members
ADD CONSTRAINT household_members_role_check
CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'child'));

-- =============================================
-- STEP 6: Create subscription feature gate functions
-- =============================================

-- Create a function to get user's active household
CREATE OR REPLACE FUNCTION get_user_active_household()
RETURNS UUID AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
  ORDER BY joined_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create a function to check if user can edit budget
CREATE OR REPLACE FUNCTION can_user_edit_budget(p_household_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE user_id = auth.uid()
    AND household_id = p_household_id
    AND (role IN ('owner', 'admin') OR can_edit_budget = true)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create subscription feature gate functions
CREATE OR REPLACE FUNCTION has_premium_features(p_household_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM households
    WHERE id = p_household_id
    AND subscription_tier = 'premium'
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_add_household_member(p_household_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    CASE
      WHEN has_premium_features(p_household_id) THEN true
      ELSE (
        SELECT COUNT(*) < max_members
        FROM household_members hm
        JOIN households h ON h.id = hm.household_id
        WHERE hm.household_id = p_household_id
        GROUP BY h.max_members
      )
    END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_use_ocr(p_household_id UUID)
RETURNS BOOLEAN AS $$
  SELECT has_premium_features(p_household_id);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_create_savings_goal(p_household_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    CASE
      WHEN has_premium_features(p_household_id) THEN true
      ELSE (
        SELECT COALESCE(COUNT(*), 0) < h.max_savings_goals
        FROM savings_goals sg
        RIGHT JOIN households h ON h.id = p_household_id
        WHERE sg.household_id = p_household_id OR sg.household_id IS NULL
        GROUP BY h.max_savings_goals
      )
    END
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_goals');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_data_retention_cutoff(p_household_id UUID)
RETURNS TIMESTAMP AS $$
  SELECT NOW() - INTERVAL '1 month' * h.data_retention_months
  FROM households h
  WHERE h.id = p_household_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- STEP 7: Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_income_sources_household ON income_sources(household_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_household ON transactions(household_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_goals') THEN
    CREATE INDEX IF NOT EXISTS idx_savings_goals_household ON savings_goals(household_id);
  END IF;
END $$;

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that households have the new columns
SELECT
  'Households with subscription_tier' as check_name,
  COUNT(*) as count
FROM households
WHERE subscription_tier IS NOT NULL;

-- Check that income_sources have household_id populated
SELECT
  'Income sources with household_id' as check_name,
  COUNT(*) as count
FROM income_sources
WHERE household_id IS NOT NULL;