-- Remove redundant family_budget_income table
-- The income_sources table will be the single source of truth for ALL income data

-- Drop the family_budget_income table and all related objects
DROP POLICY IF EXISTS "Users can view own family budget income" ON family_budget_income;
DROP POLICY IF EXISTS "Users can manage own family budget income" ON family_budget_income;

DROP INDEX IF EXISTS idx_family_budget_income_user;

DROP TRIGGER IF EXISTS update_family_budget_income_updated_at ON family_budget_income;

DROP TABLE IF EXISTS family_budget_income;

-- Verify income_sources table exists and is ready to be the single source of truth
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'income_sources'
ORDER BY ordinal_position;

-- Show current RLS policies for income_sources
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'income_sources';