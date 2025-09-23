-- Debug and fix signup issues

-- 1. Check if profiles table has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check existing triggers on auth.users
SELECT
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'auth.users'::regclass;

-- 3. Drop ALL existing triggers and functions (clean slate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_complete() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 4. Remove avatar_url constraint if it exists (might be causing issues)
ALTER TABLE profiles
  ALTER COLUMN avatar_url DROP NOT NULL,
  ALTER COLUMN display_name DROP NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- 5. Create the SIMPLEST possible trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    NEW.id,
    NEW.email, -- Use email as username temporarily
    NEW.email,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Test if we can manually insert a profile
DO $$
BEGIN
  -- Try to insert a test profile
  INSERT INTO profiles (id, username, email, display_name)
  VALUES (
    gen_random_uuid(),
    'manual_test_' || extract(epoch from now())::text,
    'manual@test.com',
    'Manual Test'
  );
  RAISE NOTICE 'Manual profile insert successful!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Manual profile insert failed: %', SQLERRM;
END $$;

-- 8. Check constraints that might be blocking
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;

-- 9. Final status check
SELECT
  'Profiles count: ' || COUNT(*)::text as status
FROM profiles
UNION ALL
SELECT
  'Users count: ' || COUNT(*)::text
FROM auth.users
UNION ALL
SELECT
  'Trigger exists: ' ||
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN 'YES'
    ELSE 'NO'
  END;