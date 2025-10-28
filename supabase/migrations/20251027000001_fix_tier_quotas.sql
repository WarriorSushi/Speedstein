-- Fix Pricing Tier Quotas
-- This migration corrects the monthly PDF quotas to match the official pricing tiers
-- Reference: TIER_QUOTAS in apps/worker/src/lib/constants.ts

-- Create a function to get correct quota for a plan tier
CREATE OR REPLACE FUNCTION get_plan_quota(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 100
    WHEN 'starter' THEN 5000
    WHEN 'pro' THEN 50000
    WHEN 'enterprise' THEN 500000  -- Corrected from 1M to 500K
    ELSE 100  -- Default to free tier
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing usage_quotas to match correct tier quotas
UPDATE usage_quotas uq
SET plan_quota = get_plan_quota(s.plan_tier)
FROM subscriptions s
WHERE uq.user_id = s.user_id
  AND uq.plan_quota != get_plan_quota(s.plan_tier);

-- Create a trigger function to auto-update quota when subscription plan changes
CREATE OR REPLACE FUNCTION sync_quota_with_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update quota when plan_tier changes
  IF OLD.plan_tier IS DISTINCT FROM NEW.plan_tier THEN
    UPDATE usage_quotas
    SET plan_quota = get_plan_quota(NEW.plan_tier)
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to subscriptions table
DROP TRIGGER IF EXISTS sync_quota_on_subscription_update ON subscriptions;
CREATE TRIGGER sync_quota_on_subscription_update
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (OLD.plan_tier IS DISTINCT FROM NEW.plan_tier)
  EXECUTE FUNCTION sync_quota_with_subscription();

-- Update the initialize_user_subscription function to use get_plan_quota
CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Create free tier subscription
  INSERT INTO subscriptions (
    user_id,
    plan_tier,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month'
  );

  -- Create usage quota using get_plan_quota function
  INSERT INTO usage_quotas (
    user_id,
    plan_quota,
    current_usage,
    period_start,
    period_end
  ) VALUES (
    NEW.id,
    get_plan_quota('free'),
    0,
    NOW(),
    NOW() + INTERVAL '1 month'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add check constraint to ensure valid plan tiers
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_tier_check
  CHECK (plan_tier IN ('free', 'starter', 'pro', 'enterprise'));

-- Add index on plan_tier for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_tier ON subscriptions(plan_tier);

-- Verify quotas are correct (returns rows that don't match expected quotas)
-- Run this manually after migration:
-- SELECT
--   s.plan_tier,
--   uq.plan_quota,
--   get_plan_quota(s.plan_tier) as expected_quota,
--   COUNT(*) as affected_users
-- FROM usage_quotas uq
-- JOIN subscriptions s ON uq.user_id = s.user_id
-- WHERE uq.plan_quota != get_plan_quota(s.plan_tier)
-- GROUP BY s.plan_tier, uq.plan_quota;
