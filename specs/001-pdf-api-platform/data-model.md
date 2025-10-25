# Data Model: Speedstein PDF API Platform

**Feature**: 001-pdf-api-platform
**Created**: 2025-10-25
**Database**: Supabase PostgreSQL with Row Level Security (RLS)

## Overview

This document defines the complete database schema for Speedstein, including all entities, relationships, constraints, indexes, and Row Level Security (RLS) policies. All tables enforce multi-tenant data isolation using RLS to ensure users can only access their own data.

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │──┐
│ email (UNIQUE)  │  │
│ password_hash   │  │
│ name            │  │
│ created_at      │  │
│ updated_at      │  │
└─────────────────┘  │
                     │
                     │ 1:N
                     ├──────────────────┐
                     │                  │
                     ▼                  ▼
          ┌─────────────────┐  ┌─────────────────┐
          │    api_keys     │  │  subscriptions  │
          │─────────────────│  │─────────────────│
          │ id (PK)         │  │ id (PK)         │
          │ user_id (FK)    │  │ user_id (FK)    │
          │ key_hash        │  │ plan_tier       │
          │ prefix          │  │ status          │
          │ name            │  │ dodo_customer_id│
          │ revoked         │  │ current_period  │
          │ created_at      │  └─────────────────┘
          │ last_used_at    │
          └────────┬────────┘
                   │
                   │ 1:N
                   ▼
          ┌─────────────────┐
          │ usage_records   │
          │─────────────────│
          │ id (PK)         │
          │ user_id (FK)    │
          │ api_key_id (FK) │
          │ pdf_url         │
          │ generation_ms   │
          │ html_hash       │
          │ created_at      │
          └─────────────────┘

          ┌─────────────────┐
          │ usage_quotas    │
          │─────────────────│
          │ id (PK)         │
          │ user_id (FK)    │──┐
          │ plan_quota      │  │ 1:1 with users
          │ current_usage   │  │
          │ period_start    │  │
          │ period_end      │  │
          └─────────────────┘  │
                               │
          ┌─────────────────┐  │
          │    invoices     │  │
          │─────────────────│  │
          │ id (PK)         │  │
          │ user_id (FK)    │──┘
          │ amount          │
          │ billing_period  │
          │ payment_status  │
          │ dodo_tx_id      │
          │ invoice_pdf_url │
          │ created_at      │
          └─────────────────┘
```

## Tables

### 1. users

Stores registered user accounts (managed by Supabase Auth).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- Managed by Supabase Auth
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_users_email ON users(email);

-- Trigger to update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Attributes**:
- `id` (UUID): Primary key, auto-generated
- `email` (TEXT): User's email address, unique constraint for login
- `password_hash` (TEXT): Bcrypt hashed password (Supabase Auth handles this)
- `name` (TEXT): Optional display name
- `created_at` (TIMESTAMPTZ): Account creation timestamp
- `updated_at` (TIMESTAMPTZ): Last modification timestamp

**RLS Policy**:
```sql
-- Users can only read their own record
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

---

### 2. api_keys

Stores API keys for authentication. Keys are SHA-256 hashed before storage.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hash of the API key
  prefix TEXT NOT NULL,            -- First 8 chars for display (e.g., "sk_live_")
  last4 TEXT NOT NULL,             -- Last 4 chars for display
  name TEXT NOT NULL,              -- User-provided descriptive name
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_revoked ON api_keys(revoked) WHERE revoked = FALSE;
```

**Attributes**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users table, CASCADE delete
- `key_hash` (TEXT): SHA-256 hash of the full API key (never store plaintext)
- `prefix` (TEXT): Display prefix (e.g., "sk_live_", "sk_test_")
- `last4` (TEXT): Last 4 characters for display in dashboard
- `name` (TEXT): User-provided label (e.g., "Production", "Staging", "Dev")
- `revoked` (BOOLEAN): Whether key has been revoked (soft delete)
- `created_at` (TIMESTAMPTZ): Key creation timestamp
- `last_used_at` (TIMESTAMPTZ): Last successful authentication timestamp

**RLS Policy**:
```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can revoke own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 3. subscriptions

Stores user subscription information and DodoPayments integration data.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'starter', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  dodo_customer_id TEXT,        -- DodoPayments customer ID
  dodo_subscription_id TEXT,    -- DodoPayments subscription ID
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month',
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_dodo_customer_id ON subscriptions(dodo_customer_id);
```

**Attributes**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users table, unique (one subscription per user)
- `plan_tier` (TEXT): Enum: 'free' (100 PDFs/mo), 'starter' (5K/$29), 'pro' (50K/$99), 'enterprise' (custom)
- `status` (TEXT): Enum: 'active', 'past_due', 'canceled', 'trialing'
- `dodo_customer_id` (TEXT): DodoPayments customer identifier (null for free tier)
- `dodo_subscription_id` (TEXT): DodoPayments subscription identifier (null for free tier)
- `current_period_start` (TIMESTAMPTZ): Billing period start date
- `current_period_end` (TIMESTAMPTZ): Billing period end date
- `cancel_at_period_end` (BOOLEAN): Whether to downgrade to free at period end
- `created_at` (TIMESTAMPTZ): Subscription creation timestamp
- `updated_at` (TIMESTAMPTZ): Last modification timestamp

**RLS Policy**:
```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can update subscriptions (via webhook handler)
CREATE POLICY "Service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.role() = 'service_role');
```

**Plan Quotas** (enforced in application logic):
- `free`: 100 PDFs/month
- `starter`: 5,000 PDFs/month ($29/mo)
- `pro`: 50,000 PDFs/month ($99/mo)
- `enterprise`: Custom quota (negotiated)

---

### 4. usage_quotas

Tracks current usage against plan quotas for rate limiting.

```sql
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan_quota INTEGER NOT NULL,     -- Max PDFs allowed this period
  current_usage INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_usage_quotas_user_id ON usage_quotas(user_id);
```

**Attributes**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users table, unique (one quota record per user)
- `plan_quota` (INTEGER): Maximum PDFs allowed in current billing period
- `current_usage` (INTEGER): Number of PDFs generated so far this period
- `period_start` (TIMESTAMPTZ): Quota period start date
- `period_end` (TIMESTAMPTZ): Quota period end date (resets usage counter)
- `updated_at` (TIMESTAMPTZ): Last usage update timestamp

**RLS Policy**:
```sql
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota"
  ON usage_quotas FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can update quotas (via API worker)
CREATE POLICY "Service role can update quotas"
  ON usage_quotas FOR UPDATE
  USING (auth.role() = 'service_role');
```

**Usage Enforcement**:
- Before generating PDF, check `current_usage < plan_quota`
- If quota exceeded, return 429 Rate Limit Exceeded
- Increment `current_usage` on successful generation
- Reset `current_usage = 0` when `period_end` is reached (scheduled job)

---

### 5. usage_records

Historical log of all PDF generations for analytics and auditing.

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,            -- Cloudflare R2 URL
  generation_time_ms INTEGER NOT NULL, -- Milliseconds taken to generate PDF
  html_size_bytes INTEGER NOT NULL,    -- Size of input HTML
  pdf_size_bytes INTEGER NOT NULL,     -- Size of output PDF
  html_hash TEXT NOT NULL,             -- SHA-256 hash for deduplication
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_api_key_id ON usage_records(api_key_id);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at DESC);
CREATE INDEX idx_usage_records_html_hash ON usage_records(html_hash);
```

**Attributes**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users table
- `api_key_id` (UUID): Foreign key to api_keys table (which key was used)
- `pdf_url` (TEXT): Cloudflare R2 public URL for the generated PDF
- `generation_time_ms` (INTEGER): Milliseconds taken to generate (for performance tracking)
- `html_size_bytes` (INTEGER): Size of input HTML payload
- `pdf_size_bytes` (INTEGER): Size of generated PDF file
- `html_hash` (TEXT): SHA-256 hash of input HTML (for cache lookups and deduplication)
- `created_at` (TIMESTAMPTZ): Generation timestamp

**RLS Policy**:
```sql
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage records"
  ON usage_records FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert records (via API worker)
CREATE POLICY "Service role can insert usage records"
  ON usage_records FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

**Retention Policy**:
- Keep usage_records for 90 days (configurable)
- Archive older records to cheaper storage (S3 Glacier or similar)
- Aggregated analytics (daily/weekly/monthly totals) stored separately

---

### 6. invoices

Billing invoices generated by DodoPayments.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,          -- Amount in cents (e.g., 2900 = $29.00)
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending', 'failed')),
  dodo_transaction_id TEXT,         -- DodoPayments transaction/invoice ID
  invoice_pdf_url TEXT,             -- URL to downloadable invoice PDF
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
```

**Attributes**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users table
- `amount` (INTEGER): Invoice amount in cents (e.g., 2900 = $29.00)
- `currency` (TEXT): Currency code (default USD)
- `billing_period_start` (TIMESTAMPTZ): Start of billing period
- `billing_period_end` (TIMESTAMPTZ): End of billing period
- `payment_status` (TEXT): Enum: 'paid', 'pending', 'failed'
- `dodo_transaction_id` (TEXT): DodoPayments transaction identifier
- `invoice_pdf_url` (TEXT): URL to generated invoice PDF (ironic!)
- `created_at` (TIMESTAMPTZ): Invoice creation timestamp

**RLS Policy**:
```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert invoices (via webhook handler)
CREATE POLICY "Service role can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

---

## Database Functions

### update_updated_at_column()

Trigger function to automatically update `updated_at` timestamps.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### reset_usage_quotas()

Scheduled function to reset quota counters at the end of billing periods.

```sql
CREATE OR REPLACE FUNCTION reset_usage_quotas()
RETURNS void AS $$
BEGIN
  UPDATE usage_quotas
  SET
    current_usage = 0,
    period_start = period_end,
    period_end = period_end + INTERVAL '1 month',
    updated_at = NOW()
  WHERE period_end <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Execution**: Schedule via pg_cron or external cron job hitting a secure endpoint:
```sql
-- Run daily at 00:00 UTC
SELECT cron.schedule('reset-quotas', '0 0 * * *', 'SELECT reset_usage_quotas();');
```

---

## Indexes Summary

Critical indexes for query performance:

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);

-- API Keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_revoked ON api_keys(revoked) WHERE revoked = FALSE;

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_dodo_customer_id ON subscriptions(dodo_customer_id);

-- Usage Quotas
CREATE INDEX idx_usage_quotas_user_id ON usage_quotas(user_id);

-- Usage Records (heavy write table, limit indexes)
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_api_key_id ON usage_records(api_key_id);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at DESC);
CREATE INDEX idx_usage_records_html_hash ON usage_records(html_hash);

-- Invoices
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
```

---

## Migration Strategy

### Initial Schema (Migration 001)
1. Create tables: users, api_keys, subscriptions, usage_quotas, usage_records, invoices
2. Add foreign key constraints
3. Create indexes
4. Create trigger functions

### RLS Policies (Migration 002)
1. Enable RLS on all tables
2. Create user-scoped SELECT policies
3. Create service-role-only INSERT/UPDATE policies for sensitive operations
4. Test policies with sample users

### Indexes (Migration 003)
1. Add performance indexes
2. Add partial indexes for filtered queries (e.g., `WHERE revoked = FALSE`)
3. Run EXPLAIN ANALYZE on common queries to validate index usage

---

## Sample Queries

### Get user's current quota and usage
```sql
SELECT
  uq.plan_quota,
  uq.current_usage,
  (uq.current_usage::FLOAT / uq.plan_quota::FLOAT * 100)::INTEGER AS percentage_used,
  uq.period_end
FROM usage_quotas uq
WHERE uq.user_id = auth.uid();
```

### Get usage breakdown by API key
```sql
SELECT
  ak.name AS api_key_name,
  COUNT(ur.id) AS pdf_count,
  AVG(ur.generation_time_ms)::INTEGER AS avg_generation_time_ms
FROM usage_records ur
JOIN api_keys ak ON ur.api_key_id = ak.id
WHERE ur.user_id = auth.uid()
  AND ur.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ak.id, ak.name
ORDER BY pdf_count DESC;
```

### Get daily usage for chart (last 30 days)
```sql
SELECT
  DATE(ur.created_at) AS date,
  COUNT(*) AS pdf_count
FROM usage_records ur
WHERE ur.user_id = auth.uid()
  AND ur.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(ur.created_at)
ORDER BY date ASC;
```

### Authenticate API key (service role query)
```sql
SELECT
  ak.id,
  ak.user_id,
  ak.name,
  ak.revoked,
  u.email,
  s.plan_tier,
  uq.plan_quota,
  uq.current_usage
FROM api_keys ak
JOIN users u ON ak.user_id = u.id
JOIN subscriptions s ON u.id = s.user_id
JOIN usage_quotas uq ON u.id = uq.user_id
WHERE ak.key_hash = encode(digest($1, 'sha256'), 'hex')
  AND ak.revoked = FALSE;
```

---

## Data Lifecycle

### User Signup
1. Supabase Auth creates entry in `auth.users`
2. Trigger creates entry in `users` table
3. Create default `subscriptions` entry (plan_tier='free', status='active')
4. Create `usage_quotas` entry (plan_quota=100, current_usage=0)

### API Key Creation
1. Generate random key: `sk_live_${randomBytes(32).toString('hex')}`
2. Extract prefix (first 8 chars) and last4 (last 4 chars)
3. Hash full key: `SHA256(key)`
4. Insert into `api_keys` (key_hash, prefix, last4, name, user_id)
5. Return full key to user ONCE (never stored in plaintext)

### PDF Generation
1. Authenticate API key via hash lookup
2. Check quota: `current_usage < plan_quota`
3. Generate PDF via Cloudflare Browser Rendering API
4. Upload to R2, get public URL
5. Insert `usage_records` entry
6. Increment `usage_quotas.current_usage`
7. Update `api_keys.last_used_at`
8. Return PDF URL to client

### Subscription Upgrade
1. User clicks "Upgrade to Starter" in dashboard
2. Frontend calls POST /api/subscriptions/checkout
3. Backend creates DodoPayments checkout session
4. Redirect user to DodoPayments hosted page
5. User completes payment
6. DodoPayments sends webhook: `payment.succeeded`
7. Webhook handler updates `subscriptions` (plan_tier='starter', dodo_subscription_id)
8. Update `usage_quotas` (plan_quota=5000)
9. Create `invoices` entry (amount=2900, payment_status='paid')

### Quota Reset (Monthly)
1. Scheduled job runs daily at 00:00 UTC
2. Find all `usage_quotas` where `period_end <= NOW()`
3. Reset `current_usage = 0`
4. Shift period: `period_start = period_end`, `period_end = period_end + 1 month`

---

## Security Considerations

1. **API Key Hashing**: NEVER store plaintext API keys. Always SHA-256 hash before storage. Display only prefix + last4 in dashboard.

2. **RLS Enforcement**: All user-facing tables MUST have RLS enabled. Users can only access their own data via `auth.uid()` checks.

3. **Service Role Operations**: Sensitive operations (updating quotas, creating invoices) MUST use service role credentials, not user JWT.

4. **Cascade Deletes**: When user is deleted (GDPR right to erasure), CASCADE deletes all related data (api_keys, subscriptions, usage_records, etc.).

5. **Rate Limiting**: Enforce quota limits at application level (Cloudflare Worker) before reaching database. Use KV for fast quota checks.

6. **SQL Injection**: Use parameterized queries for all database operations. Supabase client handles this automatically.

7. **PII Protection**: Email addresses and names are PII. Ensure GDPR compliance (data export, deletion, consent).

---

## Performance Optimization

1. **Partitioning**: Consider partitioning `usage_records` by `created_at` (monthly partitions) for faster queries on recent data.

2. **Archiving**: Archive `usage_records` older than 90 days to cold storage (S3 Glacier). Keep aggregated summaries for analytics.

3. **Caching**: Cache quota checks in Cloudflare KV to reduce database load (TTL: 60 seconds).

4. **Connection Pooling**: Use Supabase connection pooler (pgBouncer) to handle high concurrency from Cloudflare Workers.

5. **Denormalization**: Consider denormalizing frequently accessed data (e.g., store plan_quota in usage_quotas instead of joining subscriptions).

6. **Index Monitoring**: Regularly review slow queries via pg_stat_statements and add indexes as needed.

---

## Testing Data

### Seed Script (development only)

```sql
-- Create test user
INSERT INTO users (id, email, password_hash, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', '$2b$10$...', 'Test User');

-- Create test subscription (Starter plan)
INSERT INTO subscriptions (user_id, plan_tier, status, current_period_start, current_period_end) VALUES
  ('00000000-0000-0000-0000-000000000001', 'starter', 'active', NOW(), NOW() + INTERVAL '1 month');

-- Create test usage quota
INSERT INTO usage_quotas (user_id, plan_quota, current_usage, period_start, period_end) VALUES
  ('00000000-0000-0000-0000-000000000001', 5000, 150, NOW(), NOW() + INTERVAL '1 month');

-- Create test API key (key: sk_test_abcd1234)
INSERT INTO api_keys (user_id, key_hash, prefix, last4, name) VALUES
  ('00000000-0000-0000-0000-000000000001',
   encode(digest('sk_test_abcd1234', 'sha256'), 'hex'),
   'sk_test_',
   '1234',
   'Test API Key');
```

---

**Next Steps**: Use this data model as the foundation for creating database migration files in `packages/database/migrations/`.
