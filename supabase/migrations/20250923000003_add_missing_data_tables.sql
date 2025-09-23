-- Migration: Add missing data tables for complete database integration
-- Date: 2025-09-23
-- Purpose: Move Income Sources, Savings Goals, Bills, and Family Budget data from localStorage to database

-- =============================================
-- INCOME SOURCES TABLE
-- =============================================
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly', 'one-time')),
  category VARCHAR(50) DEFAULT 'salary' CHECK (category IN ('salary', 'freelance', 'investments', 'business', 'other')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SAVINGS GOALS TABLE
-- =============================================
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  target_date DATE NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('emergency-fund', 'vacation', 'major-purchase', 'retirement', 'custom')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BILLS TABLE
-- =============================================
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'quarterly', 'yearly', 'one-time')),
  category VARCHAR(50) NOT NULL,
  payment_method VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  is_automatic BOOLEAN DEFAULT false,
  reminder_days INTEGER DEFAULT 3,
  last_paid DATE,
  next_due DATE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'quarterly', 'yearly')),
  category VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  next_billing_date DATE,
  is_active BOOLEAN DEFAULT true,
  provider VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAMILY BUDGET CATEGORIES TABLE (separate from main budget_categories)
-- =============================================
CREATE TABLE family_budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_family_category UNIQUE(user_id, household_id, name)
);

-- =============================================
-- FAMILY BUDGET INCOME TABLE (separate from main income_sources for Family Budget page)
-- =============================================
CREATE TABLE family_budget_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAMILY BUDGET MEMBERS TABLE (separate from household_members for Family Budget page)
-- =============================================
CREATE TABLE family_budget_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_budget_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_budget_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INCOME SOURCES POLICIES
-- =============================================
CREATE POLICY "Users can view own income sources" ON income_sources
  FOR SELECT USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own income sources" ON income_sources
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (household_id IS NULL OR household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own income sources" ON income_sources
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner'
    ))
  );

CREATE POLICY "Users can delete own income sources" ON income_sources
  FOR DELETE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner'
    ))
  );

-- =============================================
-- SAVINGS GOALS POLICIES
-- =============================================
CREATE POLICY "Users can view own savings goals" ON savings_goals
  FOR SELECT USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own savings goals" ON savings_goals
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (household_id IS NULL OR household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own savings goals" ON savings_goals
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own savings goals" ON savings_goals
  FOR DELETE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

-- =============================================
-- BILLS POLICIES
-- =============================================
CREATE POLICY "Users can view own bills" ON bills
  FOR SELECT USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own bills" ON bills
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (household_id IS NULL OR household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own bills" ON bills
  FOR DELETE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

-- =============================================
-- SUBSCRIPTIONS POLICIES
-- =============================================
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (household_id IS NULL OR household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
  FOR DELETE USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

-- =============================================
-- FAMILY BUDGET POLICIES (similar pattern for all family budget tables)
-- =============================================
CREATE POLICY "Users can view own family budget categories" ON family_budget_categories
  FOR SELECT USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can manage own family budget categories" ON family_budget_categories
  FOR ALL USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can view own family budget income" ON family_budget_income
  FOR SELECT USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can manage own family budget income" ON family_budget_income
  FOR ALL USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can view own family budget members" ON family_budget_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can manage own family budget members" ON family_budget_members
  FOR ALL USING (
    user_id = auth.uid() OR
    (household_id IS NOT NULL AND household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    ))
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_income_sources_user ON income_sources(user_id);
CREATE INDEX idx_income_sources_household ON income_sources(household_id);
CREATE INDEX idx_income_sources_active ON income_sources(user_id, is_active);

CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_household ON savings_goals(household_id);
CREATE INDEX idx_savings_goals_active ON savings_goals(user_id, is_active);
CREATE INDEX idx_savings_goals_target_date ON savings_goals(target_date);

CREATE INDEX idx_bills_user ON bills(user_id);
CREATE INDEX idx_bills_household ON bills(household_id);
CREATE INDEX idx_bills_due_date ON bills(next_due);
CREATE INDEX idx_bills_status ON bills(status);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_household ON subscriptions(household_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_billing ON subscriptions(next_billing_date);

CREATE INDEX idx_family_budget_categories_user ON family_budget_categories(user_id);
CREATE INDEX idx_family_budget_income_user ON family_budget_income(user_id);
CREATE INDEX idx_family_budget_members_user ON family_budget_members(user_id);

-- =============================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update next billing date for subscriptions
CREATE OR REPLACE FUNCTION update_subscription_billing_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate next billing date based on frequency
  IF NEW.frequency = 'monthly' THEN
    NEW.next_billing_date = NEW.start_date + INTERVAL '1 month';
  ELSIF NEW.frequency = 'weekly' THEN
    NEW.next_billing_date = NEW.start_date + INTERVAL '1 week';
  ELSIF NEW.frequency = 'quarterly' THEN
    NEW.next_billing_date = NEW.start_date + INTERVAL '3 months';
  ELSIF NEW.frequency = 'yearly' THEN
    NEW.next_billing_date = NEW.start_date + INTERVAL '1 year';
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update next due date for bills
CREATE OR REPLACE FUNCTION update_bill_next_due()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate next due date based on frequency
  IF NEW.frequency = 'monthly' THEN
    NEW.next_due = NEW.due_date + INTERVAL '1 month';
  ELSIF NEW.frequency = 'weekly' THEN
    NEW.next_due = NEW.due_date + INTERVAL '1 week';
  ELSIF NEW.frequency = 'quarterly' THEN
    NEW.next_due = NEW.due_date + INTERVAL '3 months';
  ELSIF NEW.frequency = 'yearly' THEN
    NEW.next_due = NEW.due_date + INTERVAL '1 year';
  ELSE
    NEW.next_due = NEW.due_date;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_subscription_billing_trigger
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_billing_date();

CREATE TRIGGER update_bill_due_trigger
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_bill_next_due();

-- Generic updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_income_sources_updated_at
  BEFORE UPDATE ON income_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_budget_categories_updated_at
  BEFORE UPDATE ON family_budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_budget_income_updated_at
  BEFORE UPDATE ON family_budget_income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_budget_members_updated_at
  BEFORE UPDATE ON family_budget_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Missing data tables migration completed!';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '- income_sources';
  RAISE NOTICE '- savings_goals';
  RAISE NOTICE '- bills';
  RAISE NOTICE '- subscriptions';
  RAISE NOTICE '- family_budget_categories';
  RAISE NOTICE '- family_budget_income';
  RAISE NOTICE '- family_budget_members';
  RAISE NOTICE 'All tables have RLS enabled and proper policies.';
  RAISE NOTICE '===========================================';
END $$;