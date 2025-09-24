-- Verification query to check that new policies are in place
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('budget_periods', 'budget_categories', 'transactions')
ORDER BY tablename, policyname;