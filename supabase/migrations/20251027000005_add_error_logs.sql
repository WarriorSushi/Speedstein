-- Create error_logs table for monitoring and debugging
-- Phase 2: Foundational (T011)

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentry_event_id TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('debug', 'info', 'warning', 'error', 'fatal')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_sentry_event_id ON public.error_logs(sentry_event_id) WHERE sentry_event_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role can view error logs
CREATE POLICY "Service role can view all error logs"
  ON public.error_logs
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role can insert error logs (from Worker)
CREATE POLICY "Service role can insert error logs"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- Comment the table
COMMENT ON TABLE public.error_logs IS 'Audit log of all application errors captured by Sentry and logged by the system';
COMMENT ON COLUMN public.error_logs.sentry_event_id IS 'Corresponding Sentry event ID for cross-referencing';
COMMENT ON COLUMN public.error_logs.severity IS 'Error severity level: debug, info, warning, error, fatal';
COMMENT ON COLUMN public.error_logs.context IS 'Additional error context (request details, user agent, etc.)';
