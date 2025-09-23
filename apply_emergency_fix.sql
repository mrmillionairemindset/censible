-- Emergency fix: Remove infinite recursion in budget_periods policies
-- Apply this via Supabase Dashboard SQL Editor

-- Drop the problematic policies that reference household_members
DROP POLICY IF EXISTS "Users can view budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can create budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can update budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can delete budget periods" ON budget_periods;

-- Create simple user-only policies for budget_periods
CREATE POLICY "Users can view own budget periods" ON budget_periods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own budget periods" ON budget_periods
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budget periods" ON budget_periods
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budget periods" ON budget_periods
  FOR DELETE USING (user_id = auth.uid());

-- Also fix budget_categories policies
DROP POLICY IF EXISTS "Users can view budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can create budget categories for own periods" ON budget_categories;
DROP POLICY IF EXISTS "Users can update budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete budget categories" ON budget_categories;

-- Create policies that reference budget_periods (but don't reference household_members)
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

-- Fix transactions policies
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions" ON transactions;
DROP POLICY IF EXISTS "Household members can create transactions" ON transactions;

-- Create simple policies that don't reference household_members
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (user_id = auth.uid());