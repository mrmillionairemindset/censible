-- Migration: Fix infinite recursion in RLS policies
-- Date: 2025-09-23
-- Purpose: Fix circular reference in household_members policy checks

-- =============================================
-- TEMPORARY FIX: SIMPLIFY POLICIES TO AVOID RECURSION
-- =============================================

-- First, drop all problematic policies that reference household_members
DROP POLICY IF EXISTS "Users can view own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can create own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can update own income sources" ON income_sources;
DROP POLICY IF EXISTS "Users can delete own income sources" ON income_sources;

DROP POLICY IF EXISTS "Users can view own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can create own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can update own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can delete own savings goals" ON savings_goals;

DROP POLICY IF EXISTS "Users can view own bills" ON bills;
DROP POLICY IF EXISTS "Users can create own bills" ON bills;
DROP POLICY IF EXISTS "Users can update own bills" ON bills;
DROP POLICY IF EXISTS "Users can delete own bills" ON bills;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Users can view own family budget categories" ON family_budget_categories;
DROP POLICY IF EXISTS "Users can manage own family budget categories" ON family_budget_categories;

DROP POLICY IF EXISTS "Users can view own family budget income" ON family_budget_income;
DROP POLICY IF EXISTS "Users can manage own family budget income" ON family_budget_income;

DROP POLICY IF EXISTS "Users can view own family budget members" ON family_budget_members;
DROP POLICY IF EXISTS "Users can manage own family budget members" ON family_budget_members;

-- Drop the problematic member budget limits policies too
DROP POLICY IF EXISTS "Household members can view budget limits" ON member_budget_limits;
DROP POLICY IF EXISTS "Household owners can manage budget limits" ON member_budget_limits;

DROP POLICY IF EXISTS "Household members can view allowance transactions" ON allowance_transactions;
DROP POLICY IF EXISTS "Parents can manage allowance transactions" ON allowance_transactions;

-- =============================================
-- CREATE SIMPLIFIED POLICIES (USER-BASED ONLY FOR NOW)
-- =============================================

-- Income Sources - simplified to user_id only
CREATE POLICY "Users can view own income sources" ON income_sources
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own income sources" ON income_sources
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own income sources" ON income_sources
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own income sources" ON income_sources
  FOR DELETE USING (user_id = auth.uid());

-- Savings Goals - simplified to user_id only
CREATE POLICY "Users can view own savings goals" ON savings_goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own savings goals" ON savings_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own savings goals" ON savings_goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own savings goals" ON savings_goals
  FOR DELETE USING (user_id = auth.uid());

-- Bills - simplified to user_id only
CREATE POLICY "Users can view own bills" ON bills
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bills" ON bills
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own bills" ON bills
  FOR DELETE USING (user_id = auth.uid());

-- Subscriptions - simplified to user_id only
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- Family Budget Categories - simplified to user_id only
CREATE POLICY "Users can view own family budget categories" ON family_budget_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own family budget categories" ON family_budget_categories
  FOR ALL USING (user_id = auth.uid());

-- Family Budget Income - simplified to user_id only
CREATE POLICY "Users can view own family budget income" ON family_budget_income
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own family budget income" ON family_budget_income
  FOR ALL USING (user_id = auth.uid());

-- Family Budget Members - simplified to user_id only
CREATE POLICY "Users can view own family budget members" ON family_budget_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own family budget members" ON family_budget_members
  FOR ALL USING (user_id = auth.uid());

-- Member Budget Limits - simplified to avoid household_members reference
CREATE POLICY "Users can view budget limits" ON member_budget_limits
  FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Users can manage budget limits" ON member_budget_limits
  FOR ALL USING (member_id = auth.uid());

-- Allowance Transactions - simplified
CREATE POLICY "Users can view allowance transactions" ON allowance_transactions
  FOR SELECT USING (member_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can manage allowance transactions" ON allowance_transactions
  FOR ALL USING (created_by = auth.uid());

-- =============================================
-- COMMENT FOR FUTURE IMPROVEMENT
-- =============================================

-- NOTE: These simplified policies only allow users to access their own data.
-- Household sharing functionality will need to be re-implemented later
-- with a different approach that avoids circular references.
--
-- Options for future implementation:
-- 1. Use security definer functions instead of direct policy checks
-- 2. Create a materialized view for household membership
-- 3. Use application-level permission checks instead of RLS for household features

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RLS Infinite Recursion Fix Applied!';
  RAISE NOTICE 'All policies have been simplified to user_id only.';
  RAISE NOTICE 'Household sharing features temporarily disabled.';
  RAISE NOTICE 'Category updates should now work properly.';
  RAISE NOTICE '===========================================';
END $$;