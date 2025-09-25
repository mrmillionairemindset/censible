-- Fix signup trigger to automatically create household and add user as household member
-- This will ensure users get a default household automatically at signup

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create enhanced signup function that creates profile, household, and household membership
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

  -- 4. Create household
  INSERT INTO public.households (
    household_name,
    name,
    created_by,
    subscription_status,
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
    'individual',
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

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger exists
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname = 'on_auth_user_created';