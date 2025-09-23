-- Migration: Add household features with profiles and premium subscriptions
-- Date: 2025-09-22

-- =============================================
-- PROFILES TABLE
-- =============================================
-- User profiles with usernames for better UX
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Username constraints
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================
-- HOUSEHOLDS TABLE
-- =============================================
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

-- =============================================
-- HOUSEHOLD MEMBERS TABLE
-- =============================================
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

-- =============================================
-- HOUSEHOLD INVITATIONS TABLE
-- =============================================
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

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- =============================================
-- HOUSEHOLDS POLICIES
-- =============================================
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

-- =============================================
-- HOUSEHOLD MEMBERS POLICIES
-- =============================================
CREATE POLICY "Users can view household members" ON household_members
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Household owners can manage members" ON household_members
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =============================================
-- HOUSEHOLD INVITATIONS POLICIES
-- =============================================
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

-- =============================================
-- INDEXES
-- =============================================
CREATE UNIQUE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX household_members_household_idx ON household_members(household_id);
CREATE INDEX household_members_user_idx ON household_members(user_id);
CREATE INDEX household_invitations_code_idx ON household_invitations(invite_code);

-- =============================================
-- ADD COLUMNS TO EXISTING TABLES (if needed)
-- =============================================
ALTER TABLE budget_periods ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;
ALTER TABLE budget_categories ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);

-- =============================================
-- CREATE PROFILES FOR EXISTING USERS
-- =============================================
INSERT INTO profiles (id, username, email, display_name)
SELECT
  id,
  'user_' || LEFT(REPLACE(id::TEXT, '-', ''), 8) as username,
  email,
  COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)) as display_name
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'Household features migration completed successfully!';
  RAISE NOTICE 'Tables created: profiles, households, household_members, household_invitations';
END $$;