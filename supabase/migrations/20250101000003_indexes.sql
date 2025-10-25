-- Performance Indexes
-- This migration creates indexes for frequently queried columns

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);

-- API Keys table indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_revoked ON api_keys(revoked) WHERE revoked = FALSE;
CREATE INDEX idx_api_keys_last_used_at ON api_keys(last_used_at DESC);

-- Subscriptions table indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_dodo_customer_id ON subscriptions(dodo_customer_id);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Usage Quotas table indexes
CREATE INDEX idx_usage_quotas_user_id ON usage_quotas(user_id);
CREATE INDEX idx_usage_quotas_period_end ON usage_quotas(period_end);

-- Usage Records table indexes
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_api_key_id ON usage_records(api_key_id);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at DESC);
CREATE INDEX idx_usage_records_user_created ON usage_records(user_id, created_at DESC);

-- Invoices table indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_dodo_transaction_id ON invoices(dodo_transaction_id);

-- Composite indexes for common queries
CREATE INDEX idx_usage_records_user_period ON usage_records(user_id, created_at DESC);

CREATE INDEX idx_api_keys_user_active ON api_keys(user_id, revoked)
  WHERE revoked = FALSE;
