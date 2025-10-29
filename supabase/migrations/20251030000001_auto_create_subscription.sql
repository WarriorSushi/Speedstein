-- Migration: Auto-create subscription for new users
-- Created: 2025-10-30
-- Purpose: Automatically create a free tier subscription when a user signs up

-- Function to create a default subscription for new users
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a free tier subscription for the new user
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is created
DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_subscription();

-- Also create subscriptions for existing users who don't have one
INSERT INTO subscriptions (user_id, plan_tier, status, current_period_start, current_period_end)
SELECT
  u.id,
  'free',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.id IS NULL;
