-- Fix RLS policy for households table to allow INSERT operations
-- This addresses the "new row violates row-level security policy for table 'households'" error

-- First, check current policies on households table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'households';

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;
DROP POLICY IF EXISTS "Household owners can update their household" ON households;
DROP POLICY IF EXISTS "Household owners can delete their household" ON households;

-- Create simple, working policies for households table
-- Allow authenticated users to create households (they will be the owner)
CREATE POLICY "Allow users to create households" ON households
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to view households where they are the owner/creator
CREATE POLICY "Allow users to view own households" ON households
    FOR SELECT USING (auth.uid() = created_by);

-- Allow household owners to update their own households
CREATE POLICY "Allow owners to update own households" ON households
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Allow household owners to delete their own households
CREATE POLICY "Allow owners to delete own households" ON households
    FOR DELETE USING (auth.uid() = created_by);

-- Verify the policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'households'
ORDER BY policyname;