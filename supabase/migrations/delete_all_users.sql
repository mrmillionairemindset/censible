-- =============================================
-- DELETE ALL USERS AND RELATED DATA
-- WARNING: This will permanently delete all user data!
-- =============================================

-- First, disable RLS temporarily to ensure we can delete everything
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS households DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_subscriptions DISABLE ROW LEVEL SECURITY;

-- Delete all data from tables that reference users
-- Order matters due to foreign key constraints

-- Delete household-related data
DELETE FROM household_invitations WHERE true;
DELETE FROM household_members WHERE true;
DELETE FROM households WHERE true;

-- Delete budget and transaction data
DELETE FROM transactions WHERE true;
DELETE FROM budget_categories WHERE true;
DELETE FROM budget_periods WHERE true;

-- Delete user-related data
DELETE FROM user_subscriptions WHERE true;
DELETE FROM profiles WHERE true;

-- Delete all users from auth.users
-- This will cascade delete related data due to foreign key constraints
DELETE FROM auth.users WHERE true;

-- Re-enable RLS
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS households ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Verify deletion
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  transaction_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO transaction_count FROM transactions;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'User deletion complete!';
  RAISE NOTICE 'Remaining users: %', user_count;
  RAISE NOTICE 'Remaining profiles: %', profile_count;
  RAISE NOTICE 'Remaining transactions: %', transaction_count;
  RAISE NOTICE '===========================================';

  IF user_count = 0 THEN
    RAISE NOTICE '✅ All users successfully deleted!';
    RAISE NOTICE 'You can now create fresh accounts with username-based auth.';
  ELSE
    RAISE WARNING '⚠️ Some users may not have been deleted.';
  END IF;
END $$;