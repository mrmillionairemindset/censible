-- Fix ambiguous column references in database functions

-- 1. Fix get_user_household function - ambiguous 'id' column
CREATE OR REPLACE FUNCTION get_user_household(user_uuid UUID)
RETURNS TABLE (
  household_id UUID,
  household_name VARCHAR(255),
  role VARCHAR(20),
  subscription_status VARCHAR(50)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id AS household_id,
    h.household_name,
    hm.role,
    h.subscription_status
  FROM households h
  JOIN household_members hm ON h.id = hm.household_id
  WHERE hm.user_id = user_uuid;
END;
$$;

-- 2. Fix redeem_invitation function - ambiguous column references
CREATE OR REPLACE FUNCTION redeem_invitation(p_code VARCHAR(8), p_user_id UUID)
RETURNS TABLE (
  household_id UUID,
  household_name VARCHAR(255),
  role VARCHAR(20),
  success BOOLEAN,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = invitation_record.household_id
    AND hm.user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(255), NULL::VARCHAR(20), FALSE, 'You are already a member of this household';
    RETURN;
  END IF;

  -- Get household details
  SELECT * INTO household_record
  FROM households h
  WHERE h.id = invitation_record.household_id;

  -- Check member limits (this also checks subscription tier)
  IF NOT can_add_household_member(invitation_record.household_id) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(255), NULL::VARCHAR(20), FALSE, 'Household member limit reached';
    RETURN;
  END IF;

  -- Mark invitation as used (fix ambiguous column reference)
  UPDATE invitation_codes
  SET used_at = NOW(), used_by = p_user_id
  WHERE code = p_code;

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
$$;

-- 3. Also fix get_household_invitations for consistency
CREATE OR REPLACE FUNCTION get_household_invitations(p_household_id UUID)
RETURNS TABLE (
  code VARCHAR(8),
  email VARCHAR(255),
  role VARCHAR(20),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  invited_by_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if user has permission to view invitations
  IF NOT EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = p_household_id
    AND hm.user_id = auth.uid()
    AND hm.role IN ('owner', 'admin')
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
$$;