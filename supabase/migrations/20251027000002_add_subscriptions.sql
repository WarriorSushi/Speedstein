-- Migration: Add Subscriptions Table
-- Created: 2025-10-27
-- Purpose: Support subscription management and tier-based billing

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  dodo_subscription_id VARCHAR(255) UNIQUE,
  billing_cycle billing_cycle,
  current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '1 month',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_free_tier CHECK (
    (tier = 'free' AND dodo_subscription_id IS NULL AND billing_cycle IS NULL) OR
    (tier != 'free' AND dodo_subscription_id IS NOT NULL AND billing_cycle IS NOT NULL)
  ),
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_dodo_id ON subscriptions(dodo_subscription_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
