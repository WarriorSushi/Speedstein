-- Add missing columns to existing tables
-- Date: 2025-10-26
-- Purpose: Update existing schema with missing columns and policies

-- ============================================================================
-- TABLE: api_keys - Add missing columns
-- ============================================================================
DO $$
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
  END IF;

  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'name'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN name TEXT;
  END IF;

  -- Add last_used_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN last_used_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_api_keys_user_active ON api_keys(user_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABLE: users - Add missing columns
-- ============================================================================
DO $$
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name TEXT;
  END IF;
END $$;

-- ============================================================================
-- RLS Policies - Create if they don't exist
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role bypass users" ON users;
CREATE POLICY "Service role bypass users" ON users
USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Users can read own API keys" ON api_keys;
CREATE POLICY "Users can read own API keys" ON api_keys
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own API keys" ON api_keys;
CREATE POLICY "Users can create own API keys" ON api_keys
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
CREATE POLICY "Users can update own API keys" ON api_keys
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;
CREATE POLICY "Users can delete own API keys" ON api_keys
FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role bypass api_keys" ON api_keys;
CREATE POLICY "Service role bypass api_keys" ON api_keys
USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
CREATE POLICY "Users can read own subscription" ON subscriptions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role bypass subscriptions" ON subscriptions;
CREATE POLICY "Service role bypass subscriptions" ON subscriptions
USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Users can read own usage" ON usage_records;
CREATE POLICY "Users can read own usage" ON usage_records
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role bypass usage_records" ON usage_records;
CREATE POLICY "Service role bypass usage_records" ON usage_records
USING (auth.jwt() ->> 'role' = 'service_role');
