-- Drop existing functions
DROP FUNCTION IF EXISTS generate_invitation_code();
DROP FUNCTION IF EXISTS create_invitation(UUID, UUID, VARCHAR, VARCHAR);

-- Code generation function
CREATE FUNCTION generate_invitation_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  code VARCHAR(8);
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    code := array_to_string(
      ARRAY(
        SELECT substring('ABCDEFGHJKMNPQRSTUVWXYZ23456789' from floor(random() * 30 + 1)::int for 1)
        FROM generate_series(1, 6)
      ),
      ''
    );

    -- Check if code already exists and is active
    SELECT COUNT(*) INTO exists_check
    FROM invitation_codes
    WHERE invitation_codes.code = code
    AND used_at IS NULL
    AND expires_at > NOW();

    EXIT WHEN exists_check = 0;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an invitation
CREATE FUNCTION create_invitation(
  p_household_id UUID,
  p_invited_by UUID,
  p_email VARCHAR(255) DEFAULT NULL,
  p_role VARCHAR(20) DEFAULT 'viewer'
)
RETURNS TABLE(invitation_code VARCHAR(8), expires_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  new_code VARCHAR(8);
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate unique code
  new_code := generate_invitation_code();

  -- Set expiry to 48 hours from now
  expiry_time := NOW() + INTERVAL '48 hours';

  -- Insert invitation
  INSERT INTO invitation_codes (code, household_id, invited_by, email, role, expires_at)
  VALUES (new_code, p_household_id, p_invited_by, p_email, p_role, expiry_time);

  RETURN QUERY SELECT new_code, expiry_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;