-- Create savings_goals table for SavingsPage functionality

CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('emergency', 'vacation', 'purchase', 'education', 'retirement', 'other')),
    target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
    deadline DATE,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    auto_contribute DECIMAL(10,2) DEFAULT 0 CHECK (auto_contribute >= 0),
    contributors TEXT[], -- Array of contributor names
    notes TEXT,
    icon VARCHAR(10) DEFAULT '💰',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_savings_goals_household_id ON savings_goals(household_id);
CREATE INDEX idx_savings_goals_type ON savings_goals(type);
CREATE INDEX idx_savings_goals_priority ON savings_goals(priority);
CREATE INDEX idx_savings_goals_deadline ON savings_goals(deadline);
CREATE INDEX idx_savings_goals_is_active ON savings_goals(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for household-based access
CREATE POLICY "Users can view savings goals for their household" ON savings_goals
    FOR SELECT USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert savings goals for their household" ON savings_goals
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update savings goals for their household" ON savings_goals
    FOR UPDATE USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete savings goals for their household" ON savings_goals
    FOR DELETE USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
            AND (hm.role IN ('owner', 'admin') OR hm.user_id = savings_goals.created_by)
        )
    );

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_savings_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_savings_goals_updated_at_trigger
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_savings_goals_updated_at();

-- Add some helpful functions for savings goal management
CREATE OR REPLACE FUNCTION get_savings_progress(p_household_id UUID)
RETURNS TABLE (
    goal_id UUID,
    goal_name VARCHAR,
    target_amount DECIMAL,
    current_amount DECIMAL,
    progress_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sg.id,
        sg.name,
        sg.target_amount,
        sg.current_amount,
        ROUND((sg.current_amount / NULLIF(sg.target_amount, 0)) * 100, 2) as progress_percentage
    FROM savings_goals sg
    WHERE sg.household_id = p_household_id
        AND sg.is_active = true
    ORDER BY sg.priority DESC, sg.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add contribution to a savings goal
CREATE OR REPLACE FUNCTION add_savings_contribution(
    p_goal_id UUID,
    p_amount DECIMAL,
    p_contributor_name VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update the current amount
    UPDATE savings_goals
    SET
        current_amount = current_amount + p_amount,
        updated_at = NOW()
    WHERE id = p_goal_id
        AND household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
        );

    -- Optionally, you could log the contribution in a separate contributions table
    -- For now, we'll just update the goal amount
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get savings goals by priority
CREATE OR REPLACE FUNCTION get_priority_savings_goals(
    p_household_id UUID,
    p_priority VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    target_amount DECIMAL,
    current_amount DECIMAL,
    deadline DATE,
    priority VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sg.id,
        sg.name,
        sg.type,
        sg.target_amount,
        sg.current_amount,
        sg.deadline,
        sg.priority
    FROM savings_goals sg
    WHERE sg.household_id = p_household_id
        AND sg.is_active = true
        AND (p_priority IS NULL OR sg.priority = p_priority)
    ORDER BY
        CASE sg.priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
        END,
        sg.deadline ASC NULLS LAST,
        sg.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;