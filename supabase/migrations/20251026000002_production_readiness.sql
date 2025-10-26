-- Production Readiness Migration
-- Date: 2025-10-26
-- Purpose: Create core tables for users, API keys, subscriptions, usage tracking

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role bypass users" ON users;
CREATE POLICY "Service role bypass users" ON users
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- TABLE: api_keys
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL CHECK (length(key_hash) = 64),
  key_prefix TEXT NOT NULL CHECK (length(key_prefix) >= 8),
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_active ON api_keys(user_id, is_active) WHERE is_active = TRUE;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'starter', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  dodo_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_id ON subscriptions(dodo_subscription_id) WHERE dodo_subscription_id IS NOT NULL;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
CREATE POLICY "Users can read own subscription" ON subscriptions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role bypass subscriptions" ON subscriptions;
CREATE POLICY "Service role bypass subscriptions" ON subscriptions
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- TABLE: usage_records
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  pdf_size INTEGER NOT NULL CHECK (pdf_size > 0),
  generation_time INTEGER NOT NULL CHECK (generation_time > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_created ON usage_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_api_key ON usage_records(api_key_id) WHERE api_key_id IS NOT NULL;

ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own usage" ON usage_records;
CREATE POLICY "Users can read own usage" ON usage_records
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role bypass usage_records" ON usage_records;
CREATE POLICY "Service role bypass usage_records" ON usage_records
USING (auth.jwt() ->> 'role' = 'service_role');
