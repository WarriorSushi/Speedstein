-- Row Level Security Policies (Performance Optimized)
-- This migration enables RLS and creates policies for all tables
-- Uses (SELECT auth.uid()) pattern for better performance at scale

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- API Keys table policies
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Subscriptions table policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Usage Quotas table policies
CREATE POLICY "Users can view own usage quota"
  ON usage_quotas FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own usage quota"
  ON usage_quotas FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Usage Records table policies
CREATE POLICY "Users can view own usage records"
  ON usage_records FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own usage records"
  ON usage_records FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Invoices table policies
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Note: Service role operations bypass RLS automatically
-- No need for explicit service role policies
