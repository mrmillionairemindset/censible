-- Migration: Add family tracking and member management features
-- Date: 2025-09-23

-- =============================================
-- ADD FAMILY TRACKING TO EXISTING TABLES
-- =============================================

-- Add member tracking to transactions
DO $$
BEGIN
  -- Add member_id to track who made the transaction
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'member_id') THEN
    ALTER TABLE transactions ADD COLUMN member_id UUID REFERENCES auth.users(id);
    CREATE INDEX transactions_member_idx ON transactions(member_id);
  END IF;

  -- Add expense type (shared, personal, allowance)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'expense_type') THEN
    ALTER TABLE transactions ADD COLUMN expense_type VARCHAR(20) DEFAULT 'shared'
      CHECK (expense_type IN ('shared', 'personal', 'allowance'));
    CREATE INDEX transactions_expense_type_idx ON transactions(expense_type);
  END IF;

  -- Add approval status for transactions (for kids' transactions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'transactions' AND column_name = 'approval_status') THEN
    ALTER TABLE transactions ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved'
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    ALTER TABLE transactions ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    ALTER TABLE transactions ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================
-- ENHANCE HOUSEHOLD MEMBERS TABLE
-- =============================================

-- Add family-specific fields to household members
DO $$
BEGIN
  -- Add spending limits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'household_members' AND column_name = 'monthly_spending_limit') THEN
    ALTER TABLE household_members ADD COLUMN monthly_spending_limit DECIMAL(10,2);
  END IF;

  -- Add budget permissions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'household_members' AND column_name = 'can_edit_budget') THEN
    ALTER TABLE household_members ADD COLUMN can_edit_budget BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add allowance management
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'household_members' AND column_name = 'monthly_allowance') THEN
    ALTER TABLE household_members ADD COLUMN monthly_allowance DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE household_members ADD COLUMN allowance_balance DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Add member type for better categorization
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'household_members' AND column_name = 'member_type') THEN
    ALTER TABLE household_members ADD COLUMN member_type VARCHAR(20) DEFAULT 'adult'
      CHECK (member_type IN ('adult', 'child', 'teen'));
  END IF;

  -- Add transaction permissions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'household_members' AND column_name = 'can_add_transactions') THEN
    ALTER TABLE household_members ADD COLUMN can_add_transactions BOOLEAN DEFAULT TRUE;
    ALTER TABLE household_members ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- =============================================
-- MEMBER BUDGET LIMITS TABLE
-- =============================================

-- Create table for per-person budget limits within categories
CREATE TABLE IF NOT EXISTS member_budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique constraint per member per category
  CONSTRAINT unique_member_category_limit UNIQUE(household_id, member_id, category)
);

-- Enable RLS
ALTER TABLE member_budget_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for member budget limits
CREATE POLICY "Household members can view budget limits" ON member_budget_limits
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Household owners can manage budget limits" ON member_budget_limits
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Create indexes
CREATE INDEX member_budget_limits_household_idx ON member_budget_limits(household_id);
CREATE INDEX member_budget_limits_member_idx ON member_budget_limits(member_id);

-- =============================================
-- ALLOWANCE TRANSACTIONS TABLE
-- =============================================

-- Track allowance payments and deductions
CREATE TABLE IF NOT EXISTS allowance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'deduction', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  related_transaction_id UUID REFERENCES transactions(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Amount should be positive for payments, negative for deductions
  CONSTRAINT valid_allowance_amount CHECK (
    (transaction_type = 'payment' AND amount > 0) OR
    (transaction_type = 'deduction' AND amount <= 0) OR
    (transaction_type = 'adjustment')
  )
);

-- Enable RLS
ALTER TABLE allowance_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Household members can view allowance transactions" ON allowance_transactions
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage allowance transactions" ON allowance_transactions
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'member')
      AND member_type = 'adult'
    )
  );

-- Create indexes
CREATE INDEX allowance_transactions_household_idx ON allowance_transactions(household_id);
CREATE INDEX allowance_transactions_member_idx ON allowance_transactions(member_id);

-- =============================================
-- UPDATE EXISTING POLICIES FOR FAMILY FEATURES
-- =============================================

-- Update transaction policies to handle member permissions
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;

CREATE POLICY "Household members can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    -- User must be a household member with transaction permissions
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.user_id = auth.uid()
      AND hm.household_id = transactions.household_id
      AND hm.can_add_transactions = TRUE
    )
    OR
    -- Or it's an individual transaction
    user_id = auth.uid()
  );

-- =============================================
-- HELPER FUNCTIONS FOR FAMILY FEATURES
-- =============================================

-- Function to calculate member's current month spending
CREATE OR REPLACE FUNCTION get_member_monthly_spending(
  p_member_id UUID,
  p_household_id UUID,
  p_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_spending DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_spending
  FROM transactions
  WHERE member_id = p_member_id
    AND household_id = p_household_id
    AND DATE_TRUNC('month', date) = p_month
    AND approval_status = 'approved';

  RETURN total_spending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update allowance balances when transactions are added
CREATE OR REPLACE FUNCTION handle_allowance_transaction()
RETURNS TRIGGER AS $$
DECLARE
  member_allowance DECIMAL(10,2);
  new_balance DECIMAL(10,2);
BEGIN
  -- Only process allowance transactions
  IF NEW.expense_type = 'allowance' AND NEW.approval_status = 'approved' THEN
    -- Get member's current allowance balance
    SELECT allowance_balance INTO member_allowance
    FROM household_members
    WHERE user_id = NEW.member_id AND household_id = NEW.household_id;

    -- Calculate new balance
    new_balance := member_allowance - NEW.amount;

    -- Update the balance
    UPDATE household_members
    SET allowance_balance = new_balance
    WHERE user_id = NEW.member_id AND household_id = NEW.household_id;

    -- Create allowance transaction record
    INSERT INTO allowance_transactions (
      household_id,
      member_id,
      transaction_type,
      amount,
      description,
      related_transaction_id,
      created_by
    ) VALUES (
      NEW.household_id,
      NEW.member_id,
      'deduction',
      -NEW.amount,
      'Purchase: ' || COALESCE(NEW.description, 'No description'),
      NEW.id,
      NEW.member_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for allowance transactions
DROP TRIGGER IF EXISTS allowance_transaction_trigger ON transactions;
CREATE TRIGGER allowance_transaction_trigger
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_allowance_transaction();

-- =============================================
-- DEFAULT PERMISSIONS FOR EXISTING HOUSEHOLD MEMBERS
-- =============================================

-- Set default permissions for existing household members
UPDATE household_members
SET
  can_edit_budget = CASE WHEN role = 'owner' THEN TRUE ELSE FALSE END,
  can_add_transactions = TRUE,
  requires_approval = FALSE,
  member_type = 'adult'
WHERE can_edit_budget IS NULL;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Family tracking features migration completed!';
  RAISE NOTICE 'New features added:';
  RAISE NOTICE '- Transaction member tracking';
  RAISE NOTICE '- Expense types (shared/personal/allowance)';
  RAISE NOTICE '- Member budget limits';
  RAISE NOTICE '- Allowance management';
  RAISE NOTICE '- Permission controls';
  RAISE NOTICE '- Approval workflows';
  RAISE NOTICE '===========================================';
END $$;