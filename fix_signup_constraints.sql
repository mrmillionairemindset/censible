-- Fix signup function to use correct constraint values
-- Update plan_type to 'premium_household' and add subscription_tier

-- Drop and recreate the function with correct values
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name TEXT;
  household_name_text TEXT;
  new_household_id UUID;
BEGIN
  -- 1. Create user profile first
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Get the display name for household creation
  SELECT COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  INTO user_display_name;

  -- 3. Create household name
  household_name_text := user_display_name || '''s Household';

  -- 4. Create household with correct constraint values
  INSERT INTO public.households (
    household_name,
    name,
    created_by,
    subscription_status,
    subscription_tier,
    plan_type,
    max_members,
    max_savings_goals,
    data_retention_months
  )
  VALUES (
    household_name_text,
    household_name_text,
    NEW.id,
    'active',
    'free',
    'premium_household',
    10,
    20,
    24
  )
  RETURNING id INTO new_household_id;

  -- 5. Add user as household owner/member
  INSERT INTO public.household_members (
    household_id,
    user_id,
    role,
    member_type,
    display_name,
    joined_at,
    can_edit_budget,
    can_add_transactions,
    requires_approval
  )
  VALUES (
    new_household_id,
    NEW.id,
    'owner',
    'adult',
    user_display_name,
    NOW(),
    true,
    true,
    false
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Complete user setup failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Now create household for the existing user without one
DO $$
DECLARE
  user_rec RECORD;
  household_name_text TEXT;
  new_household_id UUID;
BEGIN
  -- Get the user without a household
  SELECT id, display_name INTO user_rec
  FROM profiles
  WHERE id = '3b67d2d2-ae9a-403c-a27f-a75b10838ee1';

  IF user_rec.id IS NOT NULL THEN
    -- Create household name
    household_name_text := user_rec.display_name || '''s Household';

    -- Create household with correct constraint values
    INSERT INTO public.households (
      household_name,
      name,
      created_by,
      subscription_status,
      subscription_tier,
      plan_type,
      max_members,
      max_savings_goals,
      data_retention_months
    )
    VALUES (
      household_name_text,
      household_name_text,
      user_rec.id,
      'active',
      'free',
      'premium_household',
      10,
      20,
      24
    )
    RETURNING id INTO new_household_id;

    -- Add user as household owner/member
    INSERT INTO public.household_members (
      household_id,
      user_id,
      role,
      member_type,
      display_name,
      joined_at,
      can_edit_budget,
      can_add_transactions,
      requires_approval
    )
    VALUES (
      new_household_id,
      user_rec.id,
      'owner',
      'adult',
      user_rec.display_name,
      NOW(),
      true,
      true,
      false
    );

    RAISE NOTICE 'Created household for user: %', user_rec.display_name;
  END IF;
END $$;