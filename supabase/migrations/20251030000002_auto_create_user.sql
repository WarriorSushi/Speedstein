-- Migration: Auto-create user record in public.users on auth signup
-- Created: 2025-10-30
-- Purpose: Automatically create a user record when someone signs up via Supabase Auth

-- First, make password_hash optional (it was required in old schema but we're using Supabase Auth now)
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Function to create a public user record when auth user is created
CREATE OR REPLACE FUNCTION create_public_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a user record in public.users with the same ID as auth.users
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_public_user();

-- Temporarily disable the subscription creation trigger to avoid conflicts
ALTER TABLE users DISABLE TRIGGER on_user_created;

-- Also create user records for existing auth users who don't have a public user record
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT
  au.id,
  au.email,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Re-enable the trigger for future user creations
ALTER TABLE users ENABLE TRIGGER on_user_created;
