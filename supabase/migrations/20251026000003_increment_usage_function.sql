-- Create increment_usage function for atomic usage tracking
-- This function safely increments the current_usage counter for a user

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE usage_quotas
  SET current_usage = current_usage + 1
  WHERE user_id = p_user_id;

  -- If no row exists, create one with default values
  IF NOT FOUND THEN
    INSERT INTO usage_quotas (user_id, plan_quota, current_usage, period_start, period_end)
    VALUES (
      p_user_id,
      100, -- Default free tier quota
      1,
      DATE_TRUNC('month', NOW()),
      DATE_TRUNC('month', NOW() + INTERVAL '1 month')
    );
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_usage(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION public.increment_usage IS 'Atomically increment PDF generation usage count for a user';
