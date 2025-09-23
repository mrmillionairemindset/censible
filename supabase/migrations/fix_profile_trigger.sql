-- Fix the profile creation trigger
-- First, drop any existing trigger that might be causing issues

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_complete CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_profile CASCADE;

-- Create a simpler, more reliable trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  username_candidate TEXT;
  counter INTEGER := 1;
BEGIN
  -- Extract username base from email
  username_base := LOWER(SPLIT_PART(NEW.email, '@', 1));
  -- Remove special characters
  username_base := REGEXP_REPLACE(username_base, '[^a-z0-9_]', '', 'g');

  -- Ensure minimum length
  IF LENGTH(username_base) < 3 THEN
    username_base := 'user';
  END IF;

  -- Truncate to max 15 chars to leave room for numbers
  username_base := LEFT(username_base, 15);

  -- Start with the base username
  username_candidate := username_base;

  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_candidate) LOOP
    username_candidate := username_base || counter::TEXT;
    counter := counter + 1;

    -- Safety check to prevent infinite loop
    IF counter > 9999 THEN
      username_candidate := 'user_' || LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 10);
      EXIT;
    END IF;
  END LOOP;

  -- Create the profile
  INSERT INTO public.profiles (id, username, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    username_candidate,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- Create user subscription (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    INSERT INTO public.user_subscriptions (user_id, tier)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix any existing users without profiles
INSERT INTO public.profiles (id, username, email, display_name, created_at, updated_at)
SELECT
  au.id,
  'user_' || LEFT(REPLACE(au.id::TEXT, '-', ''), 8),
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Profile trigger fix complete!';
  RAISE NOTICE 'Total users: %', user_count;
  RAISE NOTICE 'Total profiles: %', profile_count;

  IF user_count = profile_count THEN
    RAISE NOTICE '✅ All users now have profiles!';
  ELSE
    RAISE WARNING '⚠️ Profile count mismatch. Users: %, Profiles: %', user_count, profile_count;
  END IF;
  RAISE NOTICE '===========================================';
END $$;