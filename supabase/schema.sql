-- Budget periods table
CREATE TABLE budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_period UNIQUE(user_id, year, month)
);

-- Budget categories per period
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES budget_periods(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(100) NOT NULL,
  allocated DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  color VARCHAR(7),
  icon VARCHAR(10),
  is_custom BOOLEAN DEFAULT false,
  CONSTRAINT unique_period_category UNIQUE(period_id, category)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_id UUID REFERENCES budget_periods(id) ON DELETE SET NULL,
  category VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  merchant VARCHAR(255),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscription tier
CREATE TABLE user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_budget_periods_user_active ON budget_periods(user_id, is_active);
CREATE INDEX idx_budget_periods_user_date ON budget_periods(user_id, year DESC, month DESC);
CREATE INDEX idx_budget_categories_period ON budget_categories(period_id);
CREATE INDEX idx_transactions_user_period ON transactions(user_id, period_id);
CREATE INDEX idx_transactions_period_date ON transactions(period_id, transaction_date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);

-- Row Level Security Policies
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Budget periods policies
CREATE POLICY "Users can view own budget periods" ON budget_periods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budget periods" ON budget_periods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget periods" ON budget_periods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget periods" ON budget_periods
  FOR DELETE USING (auth.uid() = user_id);

-- Budget categories policies
CREATE POLICY "Users can view own budget categories" ON budget_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND budget_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create budget categories for own periods" ON budget_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND budget_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own budget categories" ON budget_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND budget_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own budget categories" ON budget_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM budget_periods
      WHERE budget_periods.id = budget_categories.period_id
      AND budget_periods.user_id = auth.uid()
    )
  );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- User subscriptions policies
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create user subscription on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update spent amounts when transactions change
CREATE OR REPLACE FUNCTION update_category_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an update or delete, subtract old amount
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- Only update if the category exists
    UPDATE budget_categories
    SET spent = spent - OLD.amount
    WHERE period_id = OLD.period_id
    AND category = OLD.category;
  END IF;

  -- If this is an insert or update, add new amount
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Try to update first
    UPDATE budget_categories
    SET spent = spent + NEW.amount
    WHERE period_id = NEW.period_id
    AND category = NEW.category;

    -- If category doesn't exist, create it with default values
    IF NOT FOUND THEN
      INSERT INTO budget_categories (
        period_id,
        category,
        allocated,
        spent,
        color,
        icon,
        is_custom
      ) VALUES (
        NEW.period_id,
        NEW.category,
        0, -- Default allocated
        NEW.amount, -- Set spent to transaction amount
        '#6B7280', -- Default gray color
        '📦', -- Default icon
        true -- Mark as custom since it wasn't pre-defined
      )
      ON CONFLICT (period_id, category) DO UPDATE SET
        spent = budget_categories.spent + NEW.amount;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update spent amounts
CREATE TRIGGER update_spent_on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0) -- Prevent recursive triggers
  EXECUTE FUNCTION update_category_spent();