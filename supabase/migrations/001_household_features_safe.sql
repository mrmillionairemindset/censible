-- Safe Migration: Add household features WITHOUT losing existing data
-- This version checks if tables exist before creating them

-- =============================================
-- PROFILES TABLE (only create if doesn't exist)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username VARCHAR(20) UNIQUE NOT NULL,
      display_name VARCHAR(100),
      email VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
      CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
    );

    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
    CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

    -- Create index
    CREATE UNIQUE INDEX profiles_username_idx ON profiles(username);
    CREATE INDEX profiles_email_idx ON profiles(email);
  END IF;
END $$;

-- =============================================
-- HOUSEHOLDS TABLE (only create if doesn't exist)
-- =============================================
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

    -- Enable RLS
    ALTER TABLE households ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view households they belong to" ON households
      FOR SELECT USING (
        id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can create households" ON households
      FOR INSERT WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

-- =============================================
-- HOUSEHOLD MEMBERS TABLE (only create if doesn't exist)
-- =============================================
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

    -- Enable RLS
    ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

    -- Create indexes
    CREATE INDEX household_members_household_idx ON household_members(household_id);
    CREATE INDEX household_members_user_idx ON household_members(user_id);

    -- Create policies
    CREATE POLICY "Users can view household members for their households" ON household_members
      FOR SELECT USING (
        household_id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================
-- HOUSEHOLD INVITATIONS TABLE (only create if doesn't exist)
-- =============================================
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

    -- Enable RLS
    ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

    -- Create indexes
    CREATE INDEX household_invitations_code_idx ON household_invitations(invite_code);
    CREATE INDEX household_invitations_email_idx ON household_invitations(email);
  END IF;
END $$;

-- =============================================
-- ADD COLUMNS TO EXISTING TABLES (if they don't exist)
-- =============================================

-- Add household_id to budget_periods if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'budget_periods' AND column_name = 'household_id') THEN
    ALTER TABLE budget_periods ADD COLUMN household_id UUID REFERENCES households(id);
    CREATE INDEX budget_periods_household_idx ON budget_periods(household_id);
  END IF;
END $$;

-- Add household_id and audit fields to transactions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'household_id') THEN
    ALTER TABLE transactions ADD COLUMN household_id UUID REFERENCES households(id);
    CREATE INDEX transactions_household_idx ON transactions(household_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'created_by') THEN
    ALTER TABLE transactions ADD COLUMN created_by UUID REFERENCES auth.users(id);
    ALTER TABLE transactions ADD COLUMN modified_by UUID REFERENCES auth.users(id);
    ALTER TABLE transactions ADD COLUMN modified_at TIMESTAMPTZ;
    CREATE INDEX transactions_created_by_idx ON transactions(created_by);
  END IF;
END $$;

-- Add household_id and audit fields to budget_categories if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'budget_categories' AND column_name = 'household_id') THEN
    ALTER TABLE budget_categories ADD COLUMN household_id UUID REFERENCES households(id);
    CREATE INDEX budget_categories_household_idx ON budget_categories(household_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'budget_categories' AND column_name = 'created_by') THEN
    ALTER TABLE budget_categories ADD COLUMN created_by UUID REFERENCES auth.users(id);
    ALTER TABLE budget_categories ADD COLUMN modified_by UUID REFERENCES auth.users(id);
    ALTER TABLE budget_categories ADD COLUMN modified_at TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================
-- CREATE PROFILES FOR EXISTING USERS
-- =============================================
-- This creates profiles for any existing users who don't have one yet
INSERT INTO profiles (id, username, email, display_name)
SELECT
  id,
  COALESCE(
    -- Try to use email prefix as username
    REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'),
    -- Fallback to user + timestamp
    'user' || EXTRACT(EPOCH FROM NOW())::INTEGER
  ) || '_' || SUBSTR(id::TEXT, 1, 4) as username, -- Add unique suffix from user ID
  email,
  COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)) as display_name
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- HELPFUL FUNCTIONS
-- =============================================

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    -- Generate 8-character code (uppercase letters and numbers)
    code := UPPER(
      SUBSTRING(
        REPLACE(ENCODE(gen_random_bytes(6), 'base64'), '/', '0'),
        1, 8
      )
    );

    -- Ensure code is unique
    IF NOT EXISTS (SELECT 1 FROM household_invitations WHERE invite_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has household access
CREATE OR REPLACE FUNCTION user_has_household_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = user_uuid
    AND h.subscription_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'Household features migration completed successfully!';
  RAISE NOTICE 'Existing data has been preserved.';
END $$;