-- COMPLETE POLICY FIX: Remove ALL policies that reference household_members
-- This will completely eliminate the infinite recursion issue

-- First, let's see what policies exist that might be causing issues
-- You can run this query first to see what policies are in place:
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE policyname ILIKE '%household%' OR policyname ILIKE '%member%';

-- =============================================
-- DROP ALL HOUSEHOLD/MEMBER RELATED POLICIES
-- =============================================

-- Drop all policies from household_members table itself
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can create household members" ON household_members;
DROP POLICY IF EXISTS "Users can update household members" ON household_members;
DROP POLICY IF EXISTS "Users can delete household members" ON household_members;
DROP POLICY IF EXISTS "Household owners can manage members" ON household_members;
DROP POLICY IF EXISTS "Members can view their household" ON household_members;

-- Drop any policies that reference household_members from other tables
DROP POLICY IF EXISTS "Household members can view budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Household members can create budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Household members can update budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Household members can delete budget periods" ON budget_periods;

DROP POLICY IF EXISTS "Household members can view budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Household members can create budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Household members can update budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Household members can delete budget categories" ON budget_categories;

DROP POLICY IF EXISTS "Household members can view transactions" ON transactions;
DROP POLICY IF EXISTS "Household members can create transactions" ON transactions;
DROP POLICY IF EXISTS "Household members can update transactions" ON transactions;
DROP POLICY IF EXISTS "Household members can delete transactions" ON transactions;

DROP POLICY IF EXISTS "Household members can view income sources" ON income_sources;
DROP POLICY IF EXISTS "Household members can create income sources" ON income_sources;
DROP POLICY IF EXISTS "Household members can update income sources" ON income_sources;
DROP POLICY IF EXISTS "Household members can delete income sources" ON income_sources;

-- Drop any other policies that might reference household_members
DROP POLICY IF EXISTS "Users can view own household members" ON household_members;
DROP POLICY IF EXISTS "Users can manage own household members" ON household_members;

-- =============================================
-- CREATE SIMPLE USER-ONLY POLICIES
-- =============================================

-- Budget Periods - simple user-only access
DROP POLICY IF EXISTS "Users can view budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can create budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can update budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can delete budget periods" ON budget_periods;

CREATE POLICY "Users can view own budget periods" ON budget_periods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own budget periods" ON budget_periods
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budget periods" ON budget_periods
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budget periods" ON budget_periods
  FOR DELETE USING (user_id = auth.uid());

-- Budget Categories - reference budget_periods but NOT household_members
DROP POLICY IF EXISTS "Users can view budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can create budget categories for own periods" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete budget categories" ON budget_categories;

CREATE POLICY "Users can view own budget categories" ON budget_categories
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM budget_periods bp
    WHERE bp.id = budget_categories.period_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can create budget categories for own periods" ON budget_categories
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM budget_periods bp
    WHERE bp.id = budget_categories.period_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own budget categories" ON budget_categories
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM budget_periods bp
    WHERE bp.id = budget_categories.period_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own budget categories" ON budget_categories
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM budget_periods bp
    WHERE bp.id = budget_categories.period_id
    AND bp.user_id = auth.uid()
  ));

-- Transactions - simple user-only access
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions" ON transactions;

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (user_id = auth.uid());

-- Income Sources - simple user-only access
DROP POLICY IF EXISTS "Users can view own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can create own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can update own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can delete own income sources" ON income_sources;

CREATE POLICY "Users can view own income sources" ON income_sources
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own income sources" ON income_sources
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own income sources" ON income_sources
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own income sources" ON income_sources
  FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- TEMPORARILY DISABLE HOUSEHOLD FEATURES
-- =============================================

-- Disable RLS on household_members to stop recursion completely
ALTER TABLE household_members DISABLE ROW LEVEL SECURITY;

-- Re-enable with simple policy if needed
-- ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage own household members" ON household_members
--   FOR ALL USING (user_id = auth.uid());

-- =============================================
-- VERIFICATION QUERY (run this after)
-- =============================================

-- After running this script, run this query to verify:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('budget_periods', 'budget_categories', 'transactions', 'income_sources', 'household_members')
-- ORDER BY tablename, policyname;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'COMPLETE POLICY FIX APPLIED!';
  RAISE NOTICE 'All household_members policy references removed.';
  RAISE NOTICE 'Simple user-only policies created.';
  RAISE NOTICE 'Household sharing temporarily disabled.';
  RAISE NOTICE 'Core category creation should now work.';
  RAISE NOTICE '=========================================';
END $$;