-- Quick fix for infinite recursion issue
-- Drop and recreate only the policies causing the recursion problem

-- Check which policies exist first
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE tablename IN ('income_sources', 'savings_goals', 'bills', 'subscriptions', 'family_budget_categories', 'budget_categories')
ORDER BY tablename, policyname;

-- Drop problematic policies that reference household_members
DROP POLICY IF EXISTS "Users can view own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can create own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can update own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can delete own income sources" ON income_sources;

-- Create simplified policies for income_sources
CREATE POLICY "Users can view own income sources" ON income_sources
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own income sources" ON income_sources
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own income sources" ON income_sources
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own income sources" ON income_sources
  FOR DELETE USING (user_id = auth.uid());