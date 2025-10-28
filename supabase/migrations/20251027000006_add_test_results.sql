-- Create test_results table for E2E/integration test tracking
-- Phase 2: Foundational (T012)

CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_suite TEXT NOT NULL,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'pending')),
  duration INTEGER, -- in milliseconds
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  artifacts JSONB DEFAULT '{}'::jsonb, -- screenshots, traces, logs
  error_message TEXT,
  error_stack TEXT,
  environment TEXT DEFAULT 'local', -- local, staging, production
  git_commit TEXT,
  git_branch TEXT,
  CONSTRAINT test_duration_positive CHECK (duration IS NULL OR duration >= 0)
);

-- Create indexes for efficient querying
CREATE INDEX idx_test_results_suite ON public.test_results(test_suite);
CREATE INDEX idx_test_results_status ON public.test_results(status);
CREATE INDEX idx_test_results_started_at ON public.test_results(started_at DESC);
CREATE INDEX idx_test_results_environment ON public.test_results(environment);
CREATE INDEX idx_test_results_git_commit ON public.test_results(git_commit) WHERE git_commit IS NOT NULL;

-- Composite index for finding recent failures
CREATE INDEX idx_test_results_suite_status_date ON public.test_results(test_suite, status, started_at DESC);

-- Enable Row Level Security
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone authenticated can view test results
CREATE POLICY "Authenticated users can view test results"
  ON public.test_results
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role can insert test results (from CI/CD)
CREATE POLICY "Service role can insert test results"
  ON public.test_results
  FOR INSERT
  WITH CHECK (true);

-- Comment the table
COMMENT ON TABLE public.test_results IS 'Historical record of E2E and integration test executions';
COMMENT ON COLUMN public.test_results.duration IS 'Test execution duration in milliseconds';
COMMENT ON COLUMN public.test_results.artifacts IS 'Test artifacts: screenshots, traces, video recordings';
COMMENT ON COLUMN public.test_results.environment IS 'Environment where test was executed: local, staging, production';
