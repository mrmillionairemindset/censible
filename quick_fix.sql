-- Quick fix: Drop problematic budget_periods policies causing infinite recursion
-- This will temporarily remove household sharing for budget periods but allow the app to work

-- Drop the problematic policies
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