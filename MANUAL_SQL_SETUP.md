# Manual Database Setup for Complete Persistence

Due to migration file conflicts, here's the SQL to manually run in your Supabase dashboard to create the missing tables.

## Step 1: Run this SQL in Supabase Dashboard → SQL Editor

```sql
-- =============================================
-- INCOME SOURCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS income_sources (
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
CREATE TABLE IF NOT EXISTS savings_goals (
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
CREATE TABLE IF NOT EXISTS bills (
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
CREATE TABLE IF NOT EXISTS subscriptions (
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
-- FAMILY BUDGET TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS family_budget_categories (
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

CREATE TABLE IF NOT EXISTS family_budget_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_budget_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Step 2: Run this SQL to enable Row Level Security

```sql
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
```

## Step 3: Run this SQL to create policies

```sql
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
-- FAMILY BUDGET POLICIES
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
```

## Step 4: Run this SQL to create indexes

```sql
-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_income_sources_user ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_household ON income_sources(household_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_active ON income_sources(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_household ON savings_goals(household_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_active ON savings_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);

CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_household ON bills(household_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(next_due);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_household ON subscriptions(household_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing ON subscriptions(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_family_budget_categories_user ON family_budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_family_budget_income_user ON family_budget_income(user_id);
CREATE INDEX IF NOT EXISTS idx_family_budget_members_user ON family_budget_members(user_id);
```

## What This Fixes

After running these SQL commands in your Supabase dashboard, all the following data will be properly saved to the database instead of localStorage:

### ✅ **Currently in Database:**
- Transactions
- Budget Categories & Allocations
- Budget Periods
- User Authentication & Households

### ✅ **Will be Added to Database:**
- **Income Sources** - Main budget context income sources
- **Savings Goals** - All savings goals and targets
- **Bills** - Individual bills with due dates and reminders
- **Subscriptions** - Recurring subscription payments
- **Family Budget Data** - All data from the Family Budget page:
  - Family Budget Categories (separate from main categories)
  - Family Budget Income Sources
  - Family Budget Members

### Benefits:
1. **Cross-device sync** - Data available on any device
2. **No data loss** - Browser clearing won't affect your data
3. **Household sharing** - Family members see shared data
4. **Backup & recovery** - All data safely stored in cloud database
5. **Real-time updates** - Changes sync instantly across devices

### Next Steps After SQL Setup:
1. Run the SQL commands above in your Supabase dashboard
2. The application code is already prepared to use these tables
3. Existing localStorage data will be automatically migrated on first use
4. All new data will be saved to the database instead of localStorage

This ensures complete data persistence and eliminates the localStorage dependencies you were concerned about.