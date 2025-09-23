-- Migration: Add ONLY missing household tables
-- This script checks what exists and only creates what's missing

-- =============================================
-- CHECK AND CREATE MISSING TABLES
-- =============================================

-- Check if households table exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'households') THEN
    CREATE TABLE households (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_name VARCHAR(100) NOT NULL,
      created_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
      subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
      subscription_id TEXT,
      plan_type VARCHAR(30) DEFAULT 'premium_household' CHECK (plan_type IN ('premium_household')),
      stripe_customer_id TEXT,
      trial_ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE households ENABLE ROW LEVEL SECURITY;

    -- Create policies for households
    CREATE POLICY "Users can view households they belong to" ON households
      FOR SELECT USING (
        id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can create households" ON households
      FOR INSERT WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Household owners can update their household" ON households
      FOR UPDATE USING (
        id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid() AND role = 'owner'
        )
      );

    RAISE NOTICE 'Created households table';
  ELSE
    RAISE NOTICE 'households table already exists';
  END IF;
END $$;

-- Check if household_members table exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_members') THEN
    CREATE TABLE household_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
      invited_by UUID REFERENCES auth.users(id),
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_household_user UNIQUE(household_id, user_id)
    );

    ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

    CREATE INDEX household_members_household_idx ON household_members(household_id);
    CREATE INDEX household_members_user_idx ON household_members(user_id);

    -- Create policies for household_members
    CREATE POLICY "Users can view household members" ON household_members
      FOR SELECT USING (
        household_id IN (
          SELECT household_id FROM household_members hm2
          WHERE hm2.user_id = auth.uid()
        )
      );

    CREATE POLICY "Household owners can manage members" ON household_members
      FOR ALL USING (
        household_id IN (
          SELECT household_id FROM household_members hm2
          WHERE hm2.user_id = auth.uid() AND hm2.role = 'owner'
        )
      );

    RAISE NOTICE 'Created household_members table';
  ELSE
    RAISE NOTICE 'household_members table already exists';
  END IF;
END $$;

-- Check if household_invitations table exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_invitations') THEN
    CREATE TABLE household_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
      email VARCHAR(255) NOT NULL,
      invited_username VARCHAR(20),
      invite_code VARCHAR(32) UNIQUE NOT NULL,
      invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
      used_at TIMESTAMPTZ,
      used_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

    CREATE INDEX household_invitations_code_idx ON household_invitations(invite_code);

    -- Create policies for household_invitations
    CREATE POLICY "Users can view invitations" ON household_invitations
      FOR SELECT USING (
        invited_by = auth.uid() OR
        email IN (SELECT email FROM profiles WHERE id = auth.uid())
      );

    CREATE POLICY "Household owners can create invitations" ON household_invitations
      FOR INSERT WITH CHECK (
        household_id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid() AND role = 'owner'
        )
      );

    RAISE NOTICE 'Created household_invitations table';
  ELSE
    RAISE NOTICE 'household_invitations table already exists';
  END IF;
END $$;

-- =============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add household_id to budget_periods if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'budget_periods' AND column_name = 'household_id') THEN
    ALTER TABLE budget_periods ADD COLUMN household_id UUID REFERENCES households(id);
    CREATE INDEX budget_periods_household_idx ON budget_periods(household_id);
    RAISE NOTICE 'Added household_id to budget_periods';
  END IF;
END $$;

-- Add household_id to transactions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'household_id') THEN
    ALTER TABLE transactions ADD COLUMN household_id UUID REFERENCES households(id);
    CREATE INDEX transactions_household_idx ON transactions(household_id);
    RAISE NOTICE 'Added household_id to transactions';
  END IF;
END $$;

-- Add audit columns to transactions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'created_by') THEN
    ALTER TABLE transactions ADD COLUMN created_by UUID REFERENCES auth.users(id);
    ALTER TABLE transactions ADD COLUMN modified_by UUID REFERENCES auth.users(id);
    ALTER TABLE transactions ADD COLUMN modified_at TIMESTAMPTZ;
    RAISE NOTICE 'Added audit columns to transactions';
  END IF;
END $$;

-- Add household_id to budget_categories if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'budget_categories' AND column_name = 'household_id') THEN
    ALTER TABLE budget_categories ADD COLUMN household_id UUID REFERENCES households(id);
    CREATE INDEX budget_categories_household_idx ON budget_categories(household_id);
    RAISE NOTICE 'Added household_id to budget_categories';
  END IF;
END $$;

-- =============================================
-- CREATE PROFILES FOR USERS WITHOUT ONE
-- =============================================
INSERT INTO profiles (id, username, email, display_name)
SELECT
  au.id,
  'user_' || LEFT(REPLACE(au.id::TEXT, '-', ''), 8) as username,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)) as display_name
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CHECK WHAT'S IN THE DATABASE
-- =============================================
DO $$
DECLARE
  profile_count INTEGER;
  user_count INTEGER;
  household_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO household_count FROM households;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration Status:';
  RAISE NOTICE 'Total users: %', user_count;
  RAISE NOTICE 'Total profiles: %', profile_count;
  RAISE NOTICE 'Total households: %', household_count;

  IF profile_count < user_count THEN
    RAISE WARNING 'Some users do not have profiles!';
  ELSE
    RAISE NOTICE '✅ All users have profiles';
  END IF;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration completed successfully!';
END $$;