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
  email VARCHAR(255) NOT NULL, -- Store email for username lookup
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
-- Household accounts for families/couples
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_name VARCHAR(100) NOT NULL, -- "The Smith Family"
  created_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  subscription_id TEXT, -- Stripe subscription ID
  plan_type VARCHAR(30) DEFAULT 'premium_household' CHECK (plan_type IN ('premium_household')),
  stripe_customer_id TEXT, -- Stripe customer ID
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HOUSEHOLD MEMBERS TABLE
-- =============================================
-- Track who belongs to which household
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each user can only be in one household
  CONSTRAINT unique_household_user UNIQUE(household_id, user_id)
);

-- =============================================
-- HOUSEHOLD INVITATIONS TABLE
-- =============================================
-- Manage household invitations
CREATE TABLE household_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  invited_username VARCHAR(20), -- Optional: invite by username
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MODIFY EXISTING TABLES
-- =============================================
-- Add household_id to existing tables
ALTER TABLE budget_periods ADD COLUMN household_id UUID REFERENCES households(id);
ALTER TABLE transactions ADD COLUMN household_id UUID REFERENCES households(id);

-- Add audit fields to track who made changes
ALTER TABLE transactions ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN modified_by UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN modified_at TIMESTAMPTZ;

ALTER TABLE budget_categories ADD COLUMN household_id UUID REFERENCES households(id);
ALTER TABLE budget_categories ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE budget_categories ADD COLUMN modified_by UUID REFERENCES auth.users(id);
ALTER TABLE budget_categories ADD COLUMN modified_at TIMESTAMPTZ;

-- Update user_subscriptions to include household plans
ALTER TABLE user_subscriptions
  DROP CONSTRAINT user_subscriptions_tier_check,
  ADD CONSTRAINT user_subscriptions_tier_check
    CHECK (tier IN ('free', 'paid', 'premium_household'));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE UNIQUE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX household_members_household_idx ON household_members(household_id);
CREATE INDEX household_members_user_idx ON household_members(user_id);
CREATE INDEX household_invitations_code_idx ON household_invitations(invite_code);
CREATE INDEX household_invitations_email_idx ON household_invitations(email);
CREATE INDEX household_invitations_expires_idx ON household_invitations(expires_at);
CREATE INDEX budget_periods_household_idx ON budget_periods(household_id);
CREATE INDEX transactions_household_idx ON transactions(household_id);
CREATE INDEX transactions_created_by_idx ON transactions(created_by);
CREATE INDEX budget_categories_household_idx ON budget_categories(household_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- Households policies
CREATE POLICY "Users can view households they belong to" ON households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households" ON households FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Household owners can update their household" ON households
  FOR UPDATE USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Household owners can delete their household" ON households
  FOR DELETE USING (
    id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Household members policies
CREATE POLICY "Users can view household members for their households" ON household_members
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

CREATE POLICY "Users can leave households" ON household_members
  FOR DELETE USING (user_id = auth.uid());

-- Household invitations policies
CREATE POLICY "Users can view invitations they sent" ON household_invitations
  FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Users can view invitations sent to them" ON household_invitations
  FOR SELECT USING (
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    ) OR
    invited_username IN (
      SELECT username FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Household owners can create invitations" ON household_invitations
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Invited users can update invitations" ON household_invitations
  FOR UPDATE USING (
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    ) OR
    invited_username IN (
      SELECT username FROM profiles WHERE id = auth.uid()
    )
  );

-- =============================================
-- UPDATE EXISTING POLICIES FOR HOUSEHOLD ACCESS
-- =============================================

-- Drop existing policies that only check user_id
DROP POLICY IF EXISTS "Users can view own budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can create own budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can update own budget periods" ON budget_periods;
DROP POLICY IF EXISTS "Users can delete own budget periods" ON budget_periods;

DROP POLICY IF EXISTS "Users can view own budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can create budget categories for own periods" ON budget_categories;
DROP POLICY IF EXISTS "Users can update own budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can delete own budget categories" ON budget_categories;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Create new policies that support both individual and household access
CREATE POLICY "Users can view budget periods" ON budget_periods
  FOR SELECT USING (
    user_id = auth.uid() OR -- Individual access
    household_id IN ( -- Household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create budget periods" ON budget_periods
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR -- Individual creation
    household_id IN ( -- Household creation
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget periods" ON budget_periods
  FOR UPDATE USING (
    user_id = auth.uid() OR -- Individual access
    household_id IN ( -- Household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget periods" ON budget_periods
  FOR DELETE USING (
    user_id = auth.uid() OR -- Individual access
    household_id IN ( -- Household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Budget categories policies (updated for household access)
CREATE POLICY "Users can view budget categories" ON budget_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND (
        budget_periods.user_id = auth.uid() OR
        budget_periods.household_id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid()
        )
      )
    ) OR
    household_id IN ( -- Direct household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create budget categories" ON budget_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND (
        budget_periods.user_id = auth.uid() OR
        budget_periods.household_id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid()
        )
      )
    ) OR
    household_id IN ( -- Direct household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget categories" ON budget_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND (
        budget_periods.user_id = auth.uid() OR
        budget_periods.household_id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid()
        )
      )
    ) OR
    household_id IN ( -- Direct household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget categories" ON budget_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND (
        budget_periods.user_id = auth.uid() OR
        budget_periods.household_id IN (
          SELECT household_id FROM household_members
          WHERE user_id = auth.uid()
        )
      )
    ) OR
    household_id IN ( -- Direct household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- Transactions policies (updated for household access)
CREATE POLICY "Users can view transactions" ON transactions
  FOR SELECT USING (
    user_id = auth.uid() OR -- Individual access
    household_id IN ( -- Household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR -- Individual creation
    household_id IN ( -- Household creation
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions" ON transactions
  FOR UPDATE USING (
    user_id = auth.uid() OR -- Individual access
    household_id IN ( -- Household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions" ON transactions
  FOR DELETE USING (
    user_id = auth.uid() OR -- Individual access
    household_id IN ( -- Household access
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to create profile automatically on user signup
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  username_candidate TEXT;
  username_suffix INTEGER := 0;
BEGIN
  -- Extract username base from email (part before @)
  username_base := SPLIT_PART(NEW.email, '@', 1);

  -- Clean username base (remove special chars, limit length)
  username_base := REGEXP_REPLACE(username_base, '[^a-zA-Z0-9_]', '', 'g');
  username_base := LEFT(username_base, 15);

  -- Ensure username base is not empty
  IF LENGTH(username_base) < 3 THEN
    username_base := 'user' || EXTRACT(EPOCH FROM NOW())::INTEGER;
  END IF;

  -- Find available username
  username_candidate := username_base;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username_candidate) LOOP
    username_suffix := username_suffix + 1;
    username_candidate := username_base || username_suffix;
  END LOOP;

  -- Create profile
  INSERT INTO profiles (id, username, email, display_name)
  VALUES (
    NEW.id,
    username_candidate,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Function to get user's household info
CREATE OR REPLACE FUNCTION get_user_household(user_uuid UUID)
RETURNS TABLE (
  household_id UUID,
  household_name TEXT,
  role TEXT,
  subscription_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.household_name,
    hm.role,
    h.subscription_status
  FROM households h
  JOIN household_members hm ON h.id = hm.household_id
  WHERE hm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update existing trigger to also create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user subscription
  INSERT INTO user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free');

  -- Create user profile
  PERFORM handle_new_user_profile();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_complete();

-- Trigger to update modified_at timestamps
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = NOW();
  NEW.modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_modified_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_budget_categories_modified_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW EXECUTE FUNCTION update_modified_at();

-- Set created_by on insert
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transactions_created_by
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_budget_categories_created_by
  BEFORE INSERT ON budget_categories
  FOR EACH ROW EXECUTE FUNCTION set_created_by();