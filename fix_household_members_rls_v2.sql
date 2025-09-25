-- Fix household_members RLS policies to break circular dependency
-- Users should be able to see their own member record and records from households they're in

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow users to view household members" ON household_members;
DROP POLICY IF EXISTS "Allow household owners to add members" ON household_members;
DROP POLICY IF EXISTS "Allow users to update member records" ON household_members;
DROP POLICY IF EXISTS "Allow users to leave households or owners to remove members" ON household_members;

-- Create better policies that avoid circular dependencies

-- 1. Allow users to see their own member records (this breaks the circular dependency)
CREATE POLICY "Allow users to view own member records" ON household_members
    FOR SELECT USING (user_id = auth.uid());

-- 2. Allow users to see other members of households where they are also members
-- This uses a subquery to find households the user belongs to
CREATE POLICY "Allow users to view household members where they are members" ON household_members
    FOR SELECT USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        )
    );

-- 3. Allow household owners to add new members (INSERT)
CREATE POLICY "Allow household owners to add members" ON household_members
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT id FROM households WHERE created_by = auth.uid()
        )
    );

-- 4. Allow users to update their own member record or household owners to update members
CREATE POLICY "Allow member updates" ON household_members
    FOR UPDATE USING (
        user_id = auth.uid() OR
        household_id IN (
            SELECT id FROM households WHERE created_by = auth.uid()
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        household_id IN (
            SELECT id FROM households WHERE created_by = auth.uid()
        )
    );

-- 5. Allow users to leave households (DELETE their own record) or household owners to remove members
CREATE POLICY "Allow leaving households or owner removal" ON household_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        household_id IN (
            SELECT id FROM households WHERE created_by = auth.uid()
        )
    );

-- Verify policies are created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'household_members'
ORDER BY cmd, policyname;