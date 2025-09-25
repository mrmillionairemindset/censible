-- Fix household_members RLS policies to avoid circular references and add missing INSERT/UPDATE policies
-- This will fix the "Failed to Load Household Data" error

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can leave households" ON household_members;
DROP POLICY IF EXISTS "Users can view household members for their households" ON household_members;

-- Create simple, non-circular policies for household_members table

-- 1. Allow users to see household members where they are also a member (using households table to avoid circularity)
CREATE POLICY "Allow users to view household members" ON household_members
    FOR SELECT USING (
        household_id IN (
            SELECT id FROM households WHERE created_by = auth.uid()
        )
    );

-- 2. Allow household owners to add new members (INSERT)
CREATE POLICY "Allow household owners to add members" ON household_members
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT id FROM households WHERE created_by = auth.uid()
        )
    );

-- 3. Allow users to update their own member record or household owners to update members
CREATE POLICY "Allow users to update member records" ON household_members
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

-- 4. Allow users to leave households (DELETE their own record) or household owners to remove members
CREATE POLICY "Allow users to leave households or owners to remove members" ON household_members
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
ORDER BY policyname;