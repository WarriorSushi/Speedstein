# Data Model: Launch Readiness

**Feature**: 006-launch-readiness | **Date**: 2025-10-27
**Purpose**: Define database schema, relationships, and state machines for authentication, payments, monitoring, and testing infrastructure.

## Overview

This data model extends the existing Speedstein database schema (users, api_keys, usage_records) with new entities for subscriptions, payment events, error logs, and test results. All tables use Row Level Security (RLS) policies to enforce multi-tenant isolation.

**Design Principles**:
1. **Immutability**: Payment events and error logs are append-only (never updated/deleted)
2. **Idempotency**: Unique constraints prevent duplicate processing of webhooks
3. **Auditability**: All entities have timestamps for debugging and compliance
4. **Performance**: Indexes on frequently queried columns (user_id, api_key_id, status)

---

## Entity Definitions

### 1. User Account (users)

**Purpose**: Represents a registered user with authentication credentials and subscription tier.

**State**: Already exists in database (from initial setup). This feature extends it with subscription-related fields.

**Schema**:
```sql
-- supabase/migrations/20251027000004_extend_users.sql
-- Extends existing users table (created by Supabase Auth)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Index for filtering by tier and status
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);

COMMENT ON COLUMN public.users.subscription_tier IS 'Current subscription tier: free (100 PDFs/mo), starter (5k PDFs/mo), pro (50k PDFs/mo), enterprise (500k PDFs/mo)';
COMMENT ON COLUMN public.users.account_status IS 'Account status: active (can use service), suspended (payment failed or TOS violation)';
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Primary key (Supabase Auth managed) | NOT NULL, PRIMARY KEY |
| email | TEXT | User email address (Supabase Auth managed) | NOT NULL, UNIQUE |
| password_hash | TEXT | Hashed password (Supabase Auth managed) | NOT NULL |
| subscription_tier | TEXT | Current tier: free, starter, pro, enterprise | DEFAULT 'free' |
| account_status | TEXT | Status: active, suspended | DEFAULT 'active' |
| created_at | TIMESTAMPTZ | Account creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | Last update timestamp (Supabase Auth managed) | DEFAULT NOW() |

**Relationships**:
- **ONE** user → **MANY** api_keys
- **ONE** user → **MANY** subscriptions (current + historical)
- **ONE** user → **MANY** usage_records
- **ONE** user → **MANY** error_logs (via context)

**Access Control (RLS)**:
```sql
-- RLS policy: Users can only read/update their own record
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

**State Transitions**:
```
┌─────────┐  signup  ┌──────────┐
│         │─────────→│          │
│ (none)  │          │  active  │
│         │          │          │
└─────────┘          └──────────┘
                           │
                           │ payment_failed (>3 days)
                           │ or TOS violation
                           ↓
                    ┌──────────┐
                    │suspended │
                    │          │
                    └──────────┘
                           │
                           │ payment_succeeded
                           │ or appeal approved
                           ↓
                    ┌──────────┐
                    │  active  │
                    └──────────┘
```

---

### 2. API Key (api_keys)

**Purpose**: Represents an authentication credential for programmatic API access.

**State**: Already exists. No changes needed (schema is compliant with spec).

**Schema**:
```sql
-- Existing table (no migration needed)
-- supabase/migrations/20250101000001_initial_schema.sql

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 characters for identification
  name TEXT NOT NULL,        -- Descriptive name (e.g., "Production Server")
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE UNIQUE INDEX idx_api_keys_hash_unique ON public.api_keys(key_hash);
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Primary key | NOT NULL, PRIMARY KEY |
| user_id | UUID | Foreign key to users | NOT NULL, REFERENCES users |
| key_hash | TEXT | SHA-256 hash of API key | NOT NULL, UNIQUE |
| key_prefix | TEXT | First 8 chars (for UI display) | NOT NULL |
| name | TEXT | Descriptive label | NOT NULL |
| is_active | BOOLEAN | Active or revoked | DEFAULT TRUE |
| created_at | TIMESTAMPTZ | Creation timestamp | DEFAULT NOW() |
| last_used_at | TIMESTAMPTZ | Last successful auth | NULL (updated on use) |

**Relationships**:
- **MANY** api_keys → **ONE** user
- **ONE** api_key → **MANY** usage_records

**Access Control (RLS)**:
```sql
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can revoke own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Business Rules**:
- Maximum 10 active API keys per user (enforced in application code)
- API keys never expire (user must explicitly revoke)
- Key format: `sk_[tier]_[32-character-base62-string]` (e.g., `sk_live_a1b2c3...`)

---

### 3. Subscription (subscriptions)

**Purpose**: Represents a user's billing subscription with DodoPayments.

**State**: Partially exists (created in migration 20251027000002_add_subscriptions.sql). This feature uses it.

**Schema**:
```sql
-- supabase/migrations/20251027000002_add_subscriptions.sql (already exists)
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
CREATE TYPE plan_id AS ENUM ('free', 'starter', 'pro', 'enterprise');

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id plan_id NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  dodo_subscription_id TEXT UNIQUE, -- DodoPayments subscription ID (null for free tier)
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE UNIQUE INDEX idx_subscriptions_dodo_id ON public.subscriptions(dodo_subscription_id) WHERE dodo_subscription_id IS NOT NULL;
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Primary key | NOT NULL, PRIMARY KEY |
| user_id | UUID | Foreign key to users | NOT NULL, REFERENCES users |
| plan_id | plan_id | Subscription tier enum | DEFAULT 'free' |
| status | subscription_status | Status enum | DEFAULT 'active' |
| dodo_subscription_id | TEXT | DodoPayments subscription ID | UNIQUE (null for free) |
| current_period_start | TIMESTAMPTZ | Billing period start | NULL for free tier |
| current_period_end | TIMESTAMPTZ | Billing period end | NULL for free tier |
| cancel_at_period_end | BOOLEAN | Cancel flag | DEFAULT FALSE |
| created_at | TIMESTAMPTZ | Creation timestamp | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | Last update timestamp | DEFAULT NOW() |

**Relationships**:
- **MANY** subscriptions → **ONE** user (current + historical subscriptions)
- **ONE** subscription → **MANY** payment_events (via dodo_subscription_id)

**Access Control (RLS)**:
```sql
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only webhooks can insert/update (via service role key)
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

**State Transitions**:
```
┌─────────┐  upgrade  ┌──────────┐
│  free   │──────────→│ trialing │
└─────────┘           └──────────┘
                            │
                            │ payment_succeeded
                            ↓
                      ┌──────────┐  payment_succeeded
                      │  active  │←──────────────────┐
                      └──────────┘                   │
                            │                        │
                            │ payment_failed         │
                            ↓                        │
                      ┌──────────┐                   │
                      │past_due  │                   │
                      └──────────┘                   │
                            │                        │
                            │ >3 days past_due       │
                            │ or user cancels        │
                            ↓                        │
                      ┌──────────┐                   │
                      │cancelled │                   │
                      └──────────┘                   │
                            │                        │
                            │ re-subscribe           │
                            └────────────────────────┘
```

**Business Rules**:
- Free tier: No dodo_subscription_id, no billing periods
- Paid tiers: Must have valid dodo_subscription_id and billing periods
- Only one active subscription per user at a time
- Cancelled subscriptions remain active until current_period_end
- Past_due for >3 days → account_status becomes 'suspended'

---

### 4. Usage Record (usage_records)

**Purpose**: Tracks individual PDF generation requests for quota enforcement and billing.

**State**: Already exists. No changes needed.

**Schema**:
```sql
-- Existing table (no migration needed)
-- supabase/migrations/20250101000001_initial_schema.sql

CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  pdf_size INTEGER NOT NULL,       -- PDF size in bytes
  generation_time INTEGER NOT NULL, -- Generation time in milliseconds
  html_hash TEXT,                   -- SHA-256 hash of HTML input (for caching)
  success BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_records_user_id ON public.usage_records(user_id);
CREATE INDEX idx_usage_records_api_key_id ON public.usage_records(api_key_id);
CREATE INDEX idx_usage_records_created_at ON public.usage_records(created_at);
CREATE INDEX idx_usage_records_html_hash ON public.usage_records(html_hash);
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Primary key | NOT NULL, PRIMARY KEY |
| user_id | UUID | Foreign key to users | NOT NULL, REFERENCES users |
| api_key_id | UUID | Foreign key to api_keys | REFERENCES api_keys |
| pdf_size | INTEGER | PDF size in bytes | NOT NULL |
| generation_time | INTEGER | Generation time in ms | NOT NULL |
| html_hash | TEXT | SHA-256 hash of HTML | NULL (for caching) |
| success | BOOLEAN | Success or failure | DEFAULT TRUE |
| created_at | TIMESTAMPTZ | Request timestamp | DEFAULT NOW() |

**Relationships**:
- **MANY** usage_records → **ONE** user
- **MANY** usage_records → **ONE** api_key

**Access Control (RLS)**:
```sql
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.usage_records FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (API worker)
CREATE POLICY "Service role can insert usage"
  ON public.usage_records FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

**Business Rules**:
- Quota calculated per calendar month (reset on 1st of month)
- Free: 100 PDFs/month, Starter: 5,000 PDFs/month, Pro: 50,000 PDFs/month, Enterprise: 500,000 PDFs/month
- Failed requests (success=false) do not count against quota
- html_hash used for caching (return cached PDF if hash matches within 1 hour)

---

### 5. Payment Event (payment_events)

**Purpose**: Immutable audit log of DodoPayments webhook events for debugging and compliance.

**State**: Created in migration 20251027000003_add_payment_events.sql.

**Schema**:
```sql
-- supabase/migrations/20251027000003_add_payment_events.sql (already exists)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,  -- DodoPayments event ID
  event_type TEXT NOT NULL,              -- subscription.created, payment.succeeded, etc.
  dodo_subscription_id TEXT,             -- DodoPayments subscription ID
  payload JSONB NOT NULL,                -- Full webhook payload
  processed_at TIMESTAMPTZ NOT NULL,     -- When webhook was processed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_idempotency ON public.payment_events(idempotency_key);
CREATE INDEX idx_payment_events_dodo_subscription_id ON public.payment_events(dodo_subscription_id);
CREATE INDEX idx_payment_events_event_type ON public.payment_events(event_type);
CREATE INDEX idx_payment_events_created_at ON public.payment_events(created_at);
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Primary key | NOT NULL, PRIMARY KEY |
| idempotency_key | TEXT | DodoPayments event ID | NOT NULL, UNIQUE |
| event_type | TEXT | Event type string | NOT NULL |
| dodo_subscription_id | TEXT | DodoPayments subscription ID | NULL (for non-subscription events) |
| payload | JSONB | Full webhook payload | NOT NULL |
| processed_at | TIMESTAMPTZ | Processing timestamp | NOT NULL |
| created_at | TIMESTAMPTZ | Receipt timestamp | DEFAULT NOW() |

**Relationships**:
- **MANY** payment_events → **ONE** subscription (via dodo_subscription_id, soft reference)

**Access Control (RLS)**:
```sql
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access (sensitive payment data)
CREATE POLICY "Service role can manage payment events"
  ON public.payment_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

**Business Rules**:
- Append-only table (never update or delete)
- idempotency_key prevents duplicate processing
- All webhook events stored for 7-year compliance retention
- payload contains full DodoPayments event data for debugging

**Event Types**:
- `subscription.created` - New subscription started
- `subscription.updated` - Plan upgrade/downgrade
- `subscription.cancelled` - User cancelled subscription
- `payment.succeeded` - Payment processed successfully
- `payment.failed` - Payment failed (expired card, insufficient funds)

---

### 6. Error Log (error_logs)

**Purpose**: Structured error tracking for debugging production issues (complement to Sentry).

**State**: New table (to be created).

**Schema**:
```sql
-- supabase/migrations/20251027000005_add_error_logs.sql
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentry_event_id TEXT,              -- Sentry event ID (for cross-reference)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'fatal')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,                     -- Request context (url, method, headers, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_sentry_event_id ON public.error_logs(sentry_event_id);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Primary key | NOT NULL, PRIMARY KEY |
| sentry_event_id | TEXT | Sentry event ID | NULL (not all errors go to Sentry) |
| user_id | UUID | Foreign key to users | NULL (some errors have no user) |
| severity | TEXT | Severity level enum | CHECK constraint |
| message | TEXT | Error message | NOT NULL |
| stack_trace | TEXT | Stack trace string | NULL (not all errors have traces) |
| context | JSONB | Request context | NULL |
| created_at | TIMESTAMPTZ | Error timestamp | DEFAULT NOW() |

**Relationships**:
- **MANY** error_logs → **ONE** user (soft reference, allows NULL)

**Access Control (RLS)**:
```sql
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access (sensitive error data)
CREATE POLICY "Service role can manage error logs"
  ON public.error_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

**Business Rules**:
- Append-only table (never update or delete)
- context contains sanitized request data (no API keys or passwords)
- Retention: 90 days (automated cleanup job)
- sentry_event_id enables cross-referencing with Sentry dashboard

---

### 7. Test Result (test_results)

**Purpose**: Track E2E test execution results for CI/CD pipeline.

**State**: New table (to be created).

**Schema**:
```sql
-- supabase/migrations/20251027000006_add_test_results.sql
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_suite TEXT NOT NULL,          -- e.g., "auth", "api-keys", "payment"
  test_name TEXT NOT NULL,           -- e.g., "user can sign up successfully"
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  duration INTEGER,                  -- Test duration in milliseconds
  artifacts JSONB,                   -- Screenshots, videos, traces
  error_message TEXT,                -- Error message if failed
  executed_at TIMESTAMPTZ NOT NULL,  -- Test execution timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_results_test_suite ON public.test_results(test_suite);
CREATE INDEX idx_test_results_status ON public.test_results(status);
CREATE INDEX idx_test_results_executed_at ON public.test_results(executed_at);
```

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Primary key | NOT NULL, PRIMARY KEY |
| test_suite | TEXT | Test suite name | NOT NULL |
| test_name | TEXT | Test case name | NOT NULL |
| status | TEXT | Status enum | CHECK constraint |
| duration | INTEGER | Duration in ms | NULL |
| artifacts | JSONB | Test artifacts (URLs) | NULL |
| error_message | TEXT | Error message | NULL (only for failures) |
| executed_at | TIMESTAMPTZ | Execution timestamp | NOT NULL |
| created_at | TIMESTAMPTZ | Record creation timestamp | DEFAULT NOW() |

**Relationships**: None (standalone table)

**Access Control (RLS)**:
```sql
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Only service role can access (CI/CD pipeline)
CREATE POLICY "Service role can manage test results"
  ON public.test_results FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

**Business Rules**:
- Retention: 30 days (automated cleanup job)
- artifacts contain R2 URLs to screenshots/videos
- Used for tracking test flakiness and debugging CI failures

---

## Entity Relationships Diagram

```
┌─────────────────┐
│  User Account   │
│  (users)        │
└────────┬────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐       1:N      ┌─────────────────┐
│  API Key        │─────────────────│  Usage Record   │
│  (api_keys)     │                 │ (usage_records) │
└─────────────────┘                 └─────────────────┘

┌─────────────────┐
│  User Account   │
└────────┬────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐       1:N      ┌─────────────────┐
│  Subscription   │─ ─ ─ ─ ─ ─ ─ ─│  Payment Event  │
│ (subscriptions) │ soft reference │(payment_events) │
└─────────────────┘ (dodo_sub_id)  └─────────────────┘

┌─────────────────┐
│  User Account   │
└────────┬────────┘
         │
         │ 1:N (soft)
         ↓
┌─────────────────┐
│   Error Log     │
│  (error_logs)   │
└─────────────────┘

┌─────────────────┐
│  Test Result    │
│ (test_results)  │
│ (standalone)    │
└─────────────────┘
```

**Key Relationships**:
- User → API Keys: One user can have multiple API keys (max 10 active)
- API Key → Usage Records: One API key generates many usage records
- User → Subscriptions: One user can have multiple subscriptions (current + historical)
- Subscription → Payment Events: Soft reference via dodo_subscription_id
- User → Error Logs: Soft reference (some errors have no user context)
- Test Results: Standalone (no relationships)

---

## Indexes & Performance

**Critical Indexes** (high query frequency):
```sql
-- User lookups by subscription tier
CREATE INDEX idx_users_subscription_tier ON public.users(subscription_tier);

-- API key authentication
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);

-- Usage quota calculation (current month)
CREATE INDEX idx_usage_records_user_id ON public.usage_records(user_id);
CREATE INDEX idx_usage_records_created_at ON public.usage_records(created_at);

-- Subscription status checks
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Webhook idempotency check
CREATE INDEX idx_payment_events_idempotency ON public.payment_events(idempotency_key);

-- Error debugging
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
```

**Composite Indexes** (for complex queries):
```sql
-- Quota calculation (user + current month)
CREATE INDEX idx_usage_records_user_month ON public.usage_records(user_id, created_at);

-- Active subscriptions by user
CREATE INDEX idx_subscriptions_user_status ON public.subscriptions(user_id, status);
```

**Query Patterns & Performance Targets**:
| Query | Target | Index Used |
|-------|--------|------------|
| Authenticate API key | <5ms | idx_api_keys_key_hash (unique) |
| Check quota (current month) | <10ms | idx_usage_records_user_month |
| Get user subscription | <5ms | idx_subscriptions_user_status |
| Webhook idempotency check | <5ms | idx_payment_events_idempotency (unique) |
| Recent errors (last hour) | <20ms | idx_error_logs_created_at |

---

## Data Migration Strategy

**Existing Data** (no migration needed):
- users table (extended with subscription_tier, account_status)
- api_keys table (already compliant)
- usage_records table (already compliant)

**New Tables** (to be created):
1. subscriptions (20251027000002_add_subscriptions.sql) - Already exists
2. payment_events (20251027000003_add_payment_events.sql) - Already exists
3. error_logs (20251027000005_add_error_logs.sql) - **NEW**
4. test_results (20251027000006_add_test_results.sql) - **NEW**

**Migration Order**:
1. Extend users table (add subscription_tier, account_status)
2. Create error_logs table
3. Create test_results table
4. Backfill users.subscription_tier from subscriptions table (if any exist)

**Rollback Plan**:
- All new tables are standalone (can be dropped without breaking existing features)
- New columns on users table have defaults (can be removed without data loss)

---

## Data Validation Rules

**At Application Layer** (enforced in TypeScript):
```typescript
// packages/shared/src/lib/validation.ts
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  subscription_tier: z.enum(['free', 'starter', 'pro', 'enterprise']),
  account_status: z.enum(['active', 'suspended']),
  created_at: z.date()
})

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  key_prefix: z.string().length(8),
  is_active: z.boolean(),
  created_at: z.date(),
  last_used_at: z.date().nullable()
})

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan_id: z.enum(['free', 'starter', 'pro', 'enterprise']),
  status: z.enum(['active', 'past_due', 'cancelled', 'trialing']),
  dodo_subscription_id: z.string().nullable(),
  current_period_start: z.date().nullable(),
  current_period_end: z.date().nullable(),
  cancel_at_period_end: z.boolean(),
  created_at: z.date(),
  updated_at: z.date()
})
```

**At Database Layer** (enforced in SQL):
- CHECK constraints on enums (subscription_tier, account_status, status)
- NOT NULL constraints on required fields
- UNIQUE constraints on idempotency keys
- FOREIGN KEY constraints with ON DELETE CASCADE/SET NULL

---

## Summary

This data model extends the existing Speedstein schema with 4 new tables (subscriptions, payment_events, error_logs, test_results) and 2 new columns on users (subscription_tier, account_status). All tables use Row Level Security (RLS) for multi-tenant isolation, and critical paths have indexes for performance.

**Key Design Decisions**:
1. **Immutable audit logs** (payment_events, error_logs) for compliance and debugging
2. **Idempotency via unique constraints** to prevent duplicate webhook processing
3. **Soft references** (error_logs → users) to handle cases where user context is unavailable
4. **Separate subscription history** (multiple subscriptions per user) for upgrade/downgrade tracking
5. **Standalone test results** table for CI/CD integration without coupling to user data

All entities align with the functional requirements (FR-001 through FR-058) and success criteria (SC-001 through SC-015) defined in the feature specification.

