-- Create bills table for BillsPage functionality
-- This table combines both Bill and RecurringExpense data

CREATE TABLE IF NOT EXISTS bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'quarterly', 'yearly', 'one-time')),
    category VARCHAR(100) NOT NULL,
    payment_method VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
    is_automatic BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    reminder_days INTEGER DEFAULT 3 CHECK (reminder_days >= 0),
    reminder_enabled BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    last_paid DATE,
    next_due DATE,
    assigned_to UUID REFERENCES household_members(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_bills_household_id ON bills(household_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_is_recurring ON bills(is_recurring);
CREATE INDEX idx_bills_next_due ON bills(next_due);

-- Enable RLS (Row Level Security)
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for household-based access
CREATE POLICY "Users can view bills for their household" ON bills
    FOR SELECT USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert bills for their household" ON bills
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update bills for their household" ON bills
    FOR UPDATE USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete bills for their household" ON bills
    FOR DELETE USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
            AND (hm.role IN ('owner', 'admin') OR hm.user_id = bills.created_by)
        )
    );

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bills_updated_at_trigger
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_bills_updated_at();

-- Add some helpful functions for bill management
CREATE OR REPLACE FUNCTION get_upcoming_bills(p_household_id UUID, p_days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    amount DECIMAL,
    due_date DATE,
    status VARCHAR,
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.amount,
        b.due_date,
        b.status,
        (b.due_date - CURRENT_DATE)::INTEGER as days_until_due
    FROM bills b
    WHERE b.household_id = p_household_id
        AND b.is_active = true
        AND b.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days_ahead)
    ORDER BY b.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark bill as paid
CREATE OR REPLACE FUNCTION mark_bill_paid(p_bill_id UUID, p_payment_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    UPDATE bills
    SET
        status = 'paid',
        last_paid = p_payment_date,
        next_due = CASE
            WHEN is_recurring THEN
                CASE frequency
                    WHEN 'weekly' THEN p_payment_date + INTERVAL '1 week'
                    WHEN 'monthly' THEN p_payment_date + INTERVAL '1 month'
                    WHEN 'quarterly' THEN p_payment_date + INTERVAL '3 months'
                    WHEN 'yearly' THEN p_payment_date + INTERVAL '1 year'
                    ELSE NULL
                END::DATE
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = p_bill_id
        AND household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;