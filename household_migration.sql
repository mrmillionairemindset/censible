-- =============================================
-- HOUSEHOLD-FIRST ARCHITECTURE MIGRATION
-- Purpose: Make all data properly scoped to households
-- Date: 2025-09-24
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Ensure every user has a household
-- =============================================

-- Create a default household for any users who don't have one
INSERT INTO households (id, name, created_by, created_at)
SELECT
  gen_random_uuid(),
  COALESCE(p.display_name || '''s Budget', u.email || '''s Budget'),
  u.id,
  NOW()
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM household_members hm
  WHERE hm.user_id = u.id
);

-- Add users to their default household as owners
INSERT INTO household_members (household_id, user_id, role, joined_at)
SELECT
  h.id,
  h.created_by,
  'owner',
  NOW()
FROM households h
WHERE NOT EXISTS (
  SELECT 1 FROM household_members hm
  WHERE hm.household_id = h.id AND hm.user_id = h.created_by
);

-- =============================================
-- STEP 2: Add household_id to income_sources
-- =============================================

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_sources' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE income_sources ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Populate household_id from the user's household membership
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
-- STEP 3: Add household_id to transactions
-- =============================================

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Populate household_id from the user's household membership
UPDATE transactions t
SET household_id = hm.household_id
FROM household_members hm
WHERE t.user_id = hm.user_id
AND t.household_id IS NULL;

-- Add is_shared column for personal vs household expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'is_shared'
  ) THEN
    ALTER TABLE transactions ADD COLUMN is_shared BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- =============================================
-- STEP 4: Add household_id to savings_goals
-- =============================================

-- Check if savings_goals table exists first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'savings_goals'
  ) THEN
    -- Add the column if it doesn't exist
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
-- STEP 5: Enhance household_members table & subscription system
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'household_members' AND column_name = 'can_edit_budget'
  ) THEN
    ALTER TABLE household_members ADD COLUMN can_edit_budget BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update roles to include 'child' option
ALTER TABLE household_members
DROP CONSTRAINT IF EXISTS household_members_role_check;

ALTER TABLE household_members
ADD CONSTRAINT household_members_role_check
CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'child'));

-- Add subscription tracking to households
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE households ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE households ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE households ADD COLUMN max_members INTEGER DEFAULT 4;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'max_savings_goals'
  ) THEN
    ALTER TABLE households ADD COLUMN max_savings_goals INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'households' AND column_name = 'data_retention_months'
  ) THEN
    ALTER TABLE households ADD COLUMN data_retention_months INTEGER DEFAULT 2;
  END IF;
END $$;

-- =============================================
-- STEP 6: Update RLS Policies
-- =============================================

-- Drop old policies on income_sources
DROP POLICY IF EXISTS "Users can view own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can create own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can update own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can delete own income sources" ON income_sources;

-- Create new household-based policies for income_sources
CREATE POLICY "Users can view household income sources" ON income_sources
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create household income sources" ON income_sources
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update household income sources" ON income_sources
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can delete household income sources" ON income_sources
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Drop old policies on transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Create new household-based policies for transactions
CREATE POLICY "Users can view household transactions" ON transactions
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create household transactions" ON transactions
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
      AND role != 'viewer'
    )
  );

CREATE POLICY "Users can update household transactions" ON transactions
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
    OR user_id = auth.uid() -- Can always edit own transactions
  );

CREATE POLICY "Users can delete household transactions" ON transactions
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid() -- Can always delete own transactions
  );

-- =============================================
-- STEP 7: Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_income_sources_household ON income_sources(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_household ON savings_goals(household_id)
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_goals');

-- =============================================
-- STEP 8: Remove redundant tables
-- =============================================

-- Drop family_budget_members as it's redundant with household_members
DROP TABLE IF EXISTS family_budget_members CASCADE;

-- Drop family_budget_income as income_sources handles this
DROP TABLE IF EXISTS family_budget_income CASCADE;

-- Drop family_budget_categories as budget_categories handles this
DROP TABLE IF EXISTS family_budget_categories CASCADE;

-- =============================================
-- STEP 9: Create helper views
-- =============================================

-- View for household financial summary
CREATE OR REPLACE VIEW household_financial_summary AS
SELECT
  h.id as household_id,
  h.name as household_name,
  COALESCE(SUM(CASE WHEN i.is_shared THEN i.amount ELSE 0 END), 0) as shared_income,
  COALESCE(SUM(CASE WHEN NOT i.is_shared THEN i.amount ELSE 0 END), 0) as personal_income,
  (SELECT COUNT(*) FROM household_members WHERE household_id = h.id) as member_count,
  (SELECT COALESCE(SUM(allocated), 0)
   FROM budget_categories bc
   JOIN budget_periods bp ON bc.budget_period_id = bp.id
   WHERE bp.household_id = h.id
   AND bp.year = EXTRACT(YEAR FROM CURRENT_DATE)
   AND bp.month = EXTRACT(MONTH FROM CURRENT_DATE)) as current_budget
FROM households h
LEFT JOIN income_sources i ON i.household_id = h.id AND i.is_active = true
GROUP BY h.id, h.name;

-- Grant access to the view
GRANT SELECT ON household_financial_summary TO authenticated;

-- =============================================
-- STEP 10: Update existing functions
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
        SELECT COUNT(*) < h.max_savings_goals
        FROM savings_goals sg
        JOIN households h ON h.id = sg.household_id
        WHERE sg.household_id = p_household_id
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

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that all users have households
SELECT
  'Users without households' as check_name,
  COUNT(*) as count
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM household_members hm WHERE hm.user_id = u.id
);

-- Check that all income_sources have household_id
SELECT
  'Income sources without household_id' as check_name,
  COUNT(*) as count
FROM income_sources
WHERE household_id IS NULL;

-- Check that all transactions have household_id
SELECT
  'Transactions without household_id' as check_name,
  COUNT(*) as count
FROM transactions
WHERE household_id IS NULL;

-- Show household summary
SELECT
  h.name,
  COUNT(DISTINCT hm.user_id) as members,
  COUNT(DISTINCT i.id) as income_sources,
  COUNT(DISTINCT t.id) as transactions
FROM households h
LEFT JOIN household_members hm ON h.id = hm.household_id
LEFT JOIN income_sources i ON h.id = i.household_id
LEFT JOIN transactions t ON h.id = t.household_id
GROUP BY h.id, h.name
ORDER BY members DESC;