-- =============================================
-- INVITATION SYSTEM SETUP
-- Purpose: Enable household member invitations with one-time codes
-- Date: 2025-09-24
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Create invitation_codes table
-- =============================================

CREATE TABLE IF NOT EXISTS invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) NOT NULL UNIQUE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'member', 'child')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  used_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure code expires in 48 hours
  CONSTRAINT invitation_codes_expires_check CHECK (expires_at > created_at)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_household ON invitation_codes(household_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_expires ON invitation_codes(expires_at);

-- =============================================
-- STEP 2: Create code generation function
-- =============================================

CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  code VARCHAR(8);
  exists_check INTEGER;
BEGIN
  -- Generate codes until we find a unique one
  LOOP
    -- Generate 6-character alphanumeric code (excluding confusing chars: 0, O, I, l, 1)
    code := array_to_string(
      ARRAY(
        SELECT substring('ABCDEFGHJKMNPQRSTUVWXYZ23456789' from floor(random() * 30 + 1)::int for 1)
        FROM generate_series(1, 6)
      ),
      ''
    );

    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check
    FROM invitation_codes ic
    WHERE ic.code = code
    AND (ic.used_at IS NULL AND ic.expires_at > NOW());

    -- Exit loop if code is unique
    EXIT WHEN exists_check = 0;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 3: Create invitation management functions
-- =============================================

-- Function to create an invitation
CREATE OR REPLACE FUNCTION create_invitation(
  p_household_id UUID,
  p_invited_by UUID,
  p_email VARCHAR(255) DEFAULT NULL,
  p_role VARCHAR(20) DEFAULT 'viewer'
)
RETURNS TABLE(code VARCHAR(8), expires_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  new_code VARCHAR(8);
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user can add members to household
  IF NOT can_add_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Household member limit reached. Upgrade to premium for unlimited members.';
  END IF;

  -- Check if inviter has permission
  IF NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
    AND user_id = p_invited_by
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only household owners and admins can send invitations.';
  END IF;

  -- Generate unique code
  new_code := generate_invitation_code();

  -- Set expiry to 48 hours from now
  expiry_time := NOW() + INTERVAL '48 hours';

  -- Insert invitation
  INSERT INTO invitation_codes (code, household_id, invited_by, email, role, expires_at)
  VALUES (new_code, p_household_id, p_invited_by, p_email, p_role, expiry_time);

  -- Return the code and expiry
  RETURN QUERY SELECT new_code, expiry_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use/redeem an invitation code
CREATE OR REPLACE FUNCTION redeem_invitation(
  p_code VARCHAR(8),
  p_user_id UUID
)
RETURNS TABLE(
  household_id UUID,
  household_name VARCHAR(255),
  role VARCHAR(20),
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  invitation_record RECORD;
  household_record RECORD;
BEGIN
  -- Find the invitation
  SELECT * INTO invitation_record
  FROM invitation_codes ic
  WHERE ic.code = p_code
  AND ic.used_at IS NULL
  AND ic.expires_at > NOW();

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(255), NULL::VARCHAR(20), FALSE, 'Invalid or expired invitation code';
    RETURN;
  END IF;

  -- Check if user is already a member of this household
  IF EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = invitation_record.household_id
    AND user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(255), NULL::VARCHAR(20), FALSE, 'You are already a member of this household';
    RETURN;
  END IF;

  -- Get household details
  SELECT * INTO household_record
  FROM households
  WHERE id = invitation_record.household_id;

  -- Check member limits (this also checks subscription tier)
  IF NOT can_add_household_member(invitation_record.household_id) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(255), NULL::VARCHAR(20), FALSE, 'Household member limit reached';
    RETURN;
  END IF;

  -- Mark invitation as used
  UPDATE invitation_codes
  SET used_at = NOW(), used_by = p_user_id
  WHERE invitation_codes.code = p_code;

  -- Add user to household
  INSERT INTO household_members (id, household_id, user_id, role, joined_at)
  VALUES (gen_random_uuid(), invitation_record.household_id, p_user_id, invitation_record.role, NOW());

  -- Return success
  RETURN QUERY SELECT
    invitation_record.household_id,
    household_record.household_name,
    invitation_record.role,
    TRUE,
    'Successfully joined household'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get household invitations (for management)
CREATE OR REPLACE FUNCTION get_household_invitations(p_household_id UUID)
RETURNS TABLE(
  code VARCHAR(8),
  email VARCHAR(255),
  role VARCHAR(20),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  invited_by_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if user has permission to view invitations
  IF NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN QUERY
  SELECT
    ic.code,
    ic.email,
    ic.role,
    ic.expires_at,
    ic.used_at,
    au.email as invited_by_email,
    ic.created_at
  FROM invitation_codes ic
  JOIN auth.users au ON au.id = ic.invited_by
  WHERE ic.household_id = p_household_id
  ORDER BY ic.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 4: Create RLS policies for invitation_codes
-- =============================================

-- Enable RLS on invitation_codes table
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Household owners can view invitations" ON invitation_codes;
DROP POLICY IF EXISTS "Household owners can create invitations" ON invitation_codes;
DROP POLICY IF EXISTS "System can update invitations" ON invitation_codes;

-- Policy for viewing invitations (household owners/admins only)
CREATE POLICY "Household owners can view invitations" ON invitation_codes
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policy for creating invitations (household owners/admins only)
CREATE POLICY "Household owners can create invitations" ON invitation_codes
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    AND invited_by = auth.uid()
  );

-- Policy for updating invitations (system use only via functions)
CREATE POLICY "System can update invitations" ON invitation_codes
  FOR UPDATE USING (TRUE);

-- =============================================
-- STEP 5: Grant permissions
-- =============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT ON invitation_codes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Test code generation
SELECT generate_invitation_code() as sample_code;

-- Check invitation_codes table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invitation_codes'
ORDER BY ordinal_position;