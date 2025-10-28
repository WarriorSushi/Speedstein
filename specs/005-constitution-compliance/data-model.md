# Data Model: Constitution Compliance

**Feature**: Constitution Compliance - Production Readiness
**Branch**: `005-constitution-compliance`
**Date**: 2025-10-27

## Overview

This document defines the data entities, relationships, validation rules, and state transitions for the Constitution Compliance feature. All entities align with Supabase PostgreSQL schema and include Row Level Security (RLS) considerations.

---

## Entity 1: Subscription

**Purpose**: Tracks user payment plan and billing status for tier-based quota enforcement.

### Fields

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique subscription identifier |
| `user_id` | UUID | FOREIGN KEY (users.id), NOT NULL, UNIQUE | One subscription per user |
| `tier` | ENUM | NOT NULL, CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')) | Current subscription tier |
| `status` | ENUM | NOT NULL, CHECK (status IN ('active', 'past_due', 'cancelled')) | Billing status |
| `dodo_subscription_id` | VARCHAR(255) | UNIQUE, NULLABLE | DodoPayments subscription ID (NULL for free tier) |
| `billing_cycle` | ENUM | NULLABLE, CHECK (billing_cycle IN ('monthly', 'yearly')) | NULL for free tier |
| `current_period_start` | TIMESTAMP | NOT NULL | Start of current billing period |
| `current_period_end` | TIMESTAMP | NOT NULL | End of current billing period (used for quota resets) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Subscription creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |

### Relationships

- **user_id → users.id**: One-to-one relationship (each user has exactly one subscription)
- **Linked to quota_usage**: Subscription tier determines monthly quota limits
- **Linked to payment_events**: Historical payment events reference user_id

### State Transitions

```
Initial State: free (status: active)

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  free (active)  →  [upgrade]  →  starter/pro/enterprise (active)  │
│       ↑                                    ↓                   │
│       │                          [payment_failed]             │
│       │                                    ↓                   │
│       │                            past_due (active)          │
│       │                                    ↓                   │
│       │                        [grace period: 7 days]         │
│       │                                    ↓                   │
│       └──────────────────────  cancelled (inactive)  ←────────┘
│                                         ↑                      │
│                                [user cancellation]            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Transition Rules**:
1. **Upgrade (free → paid)**: User completes DodoPayments checkout, webhook fires `subscription.created`
2. **Payment Failed (active → past_due)**: Webhook fires `payment.failed`, status changes to `past_due`
3. **Grace Period Expired (past_due → cancelled)**: 7 days after payment failure, cron job downgrades to free tier
4. **User Cancellation (active → cancelled)**: User cancels subscription, effective at `current_period_end`
5. **Reactivation (cancelled → active)**: User re-subscribes after cancellation

### Validation Rules

1. **Tier Consistency**: `tier` must match `TIER_QUOTAS` in `apps/worker/src/lib/constants.ts`
   ```typescript
   const TIER_QUOTAS = {
     free: { monthlyPdfs: 100, requestsPerMinute: 10, retentionDays: 1 },
     starter: { monthlyPdfs: 5_000, requestsPerMinute: 50, retentionDays: 7 },
     pro: { monthlyPdfs: 50_000, requestsPerMinute: 200, retentionDays: 30 },
     enterprise: { monthlyPdfs: 500_000, requestsPerMinute: 1000, retentionDays: 90 },
   };
   ```

2. **Status Transitions**: Only allowed transitions are defined in state diagram above
3. **Free Tier Rules**: `dodo_subscription_id` and `billing_cycle` must be NULL for tier='free'
4. **Paid Tier Rules**: `dodo_subscription_id` and `billing_cycle` must be NOT NULL for paid tiers
5. **Period Consistency**: `current_period_end` must be after `current_period_start`

### RLS Policies

```sql
-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can update subscriptions (webhooks)
CREATE POLICY "Service can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## Entity 2: Payment Event

**Purpose**: Audit log of all DodoPayments webhook events for idempotency and billing reconciliation.

### Fields

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Internal database ID |
| `event_id` | VARCHAR(255) | UNIQUE, NOT NULL | DodoPayments event ID (idempotency key) |
| `event_type` | VARCHAR(100) | NOT NULL, CHECK (event_type IN ('subscription.created', 'subscription.updated', 'payment.succeeded', 'payment.failed', 'subscription.cancelled')) | Webhook event type |
| `user_id` | UUID | FOREIGN KEY (users.id), NOT NULL | User associated with event |
| `dodo_event_payload` | JSONB | NOT NULL | Full webhook payload from DodoPayments |
| `webhook_signature` | VARCHAR(255) | NOT NULL | HMAC-SHA256 signature for verification |
| `processed_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When webhook was successfully processed |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When event was received |

### Relationships

- **user_id → users.id**: Many payment events per user

### Validation Rules

1. **Webhook Signature Verification**: Before processing, verify `webhook_signature` using HMAC-SHA256
   ```typescript
   const computedSignature = crypto
     .createHmac('sha256', env.DODO_PAYMENTS_SECRET_KEY)
     .update(JSON.stringify(dodo_event_payload))
     .digest('hex');

   if (computedSignature !== webhook_signature) {
     throw new Error('Invalid webhook signature');
   }
   ```

2. **Idempotency**: Check if `event_id` already exists before processing to prevent duplicate handling
3. **Event Type Validation**: `event_type` must match DodoPayments documented event types
4. **Payload Validation**: Use Zod schema to validate `dodo_event_payload` structure

### RLS Policies

```sql
-- Users cannot directly access payment events (admin only)
CREATE POLICY "Only service can access payment events"
  ON payment_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## Entity 3: User Account (Extended)

**Purpose**: Store user authentication and profile information with email verification support.

### New Fields (additions to existing schema)

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `email_verified` | BOOLEAN | NOT NULL, DEFAULT FALSE | Email verification status |
| `verification_token` | VARCHAR(64) | NULLABLE, UNIQUE | Token for email verification (NULL after verified) |
| `verification_token_expires_at` | TIMESTAMP | NULLABLE | Token expiration (24 hours from creation) |
| `reset_token` | VARCHAR(64) | NULLABLE, UNIQUE | Token for password reset (NULL when not resetting) |
| `reset_token_expires_at` | TIMESTAMP | NULLABLE | Reset token expiration (1 hour from creation) |
| `dark_mode_preference` | BOOLEAN | NULLABLE | User's dark mode preference (NULL = system default) |

### Existing Fields (no changes)

- `id` (UUID, PRIMARY KEY)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `hashed_password` (VARCHAR, NOT NULL) - bcrypt hashed
- `plan_tier` (ENUM: 'free', 'starter', 'pro', 'enterprise')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Validation Rules

1. **Email Format**: Must match regex `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
2. **Password Complexity**: Minimum 8 characters, at least one uppercase, one lowercase, one digit
3. **Token Expiration**: Verification tokens expire in 24 hours, reset tokens in 1 hour
4. **Email Verified**: Users cannot generate API keys or access dashboard until `email_verified = TRUE`

### RLS Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (excluding tier)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND plan_tier = OLD.plan_tier);
```

---

## Entity 4: API Key (No Changes)

**Purpose**: Store hashed API keys for user authentication to the PDF generation API.

### Fields

- `id` (UUID, PRIMARY KEY)
- `key_hash` (VARCHAR(64), UNIQUE, NOT NULL) - SHA-256 hashed
- `user_id` (UUID, FOREIGN KEY users.id, NOT NULL)
- `created_at` (TIMESTAMP, NOT NULL)
- `last_used_at` (TIMESTAMP, NULLABLE)
- `revoked` (BOOLEAN, NOT NULL, DEFAULT FALSE)

**No modifications needed - already compliant with constitution.**

---

## Entity 5: Quota Usage (No Changes)

**Purpose**: Track monthly PDF generation counts per user for quota enforcement.

### Fields

- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY users.id, NOT NULL)
- `period_start` (TIMESTAMP, NOT NULL)
- `period_end` (TIMESTAMP, NOT NULL)
- `quota_limit` (INTEGER, NOT NULL) - from `TIER_QUOTAS[tier].monthlyPdfs`
- `used_count` (INTEGER, NOT NULL, DEFAULT 0)
- `remaining_count` (INTEGER, NOT NULL) - computed: `quota_limit - used_count`

**No modifications needed - already compliant with constitution.**

---

## Database Migrations Required

### Migration 1: Add Subscription Table

**File**: `supabase/migrations/20251027000002_add_subscriptions.sql`

```sql
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
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Migration 2: Add Payment Events Table

**File**: `supabase/migrations/20251027000003_add_payment_events.sql`

```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dodo_event_payload JSONB NOT NULL,
  webhook_signature VARCHAR(255) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'subscription.created',
    'subscription.updated',
    'payment.succeeded',
    'payment.failed',
    'subscription.cancelled'
  ))
);

CREATE INDEX idx_payment_events_user_id ON payment_events(user_id);
CREATE INDEX idx_payment_events_event_id ON payment_events(event_id);
CREATE INDEX idx_payment_events_created_at ON payment_events(created_at DESC);
```

### Migration 3: Extend Users Table

**File**: `supabase/migrations/20251027000004_extend_users.sql`

```sql
ALTER TABLE users
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN verification_token VARCHAR(64) UNIQUE,
  ADD COLUMN verification_token_expires_at TIMESTAMP,
  ADD COLUMN reset_token VARCHAR(64) UNIQUE,
  ADD COLUMN reset_token_expires_at TIMESTAMP,
  ADD COLUMN dark_mode_preference BOOLEAN;

CREATE INDEX idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
```

---

## Summary

**3 new entities** (Subscription, Payment Event, User extensions) have been defined with:
- Complete field specifications
- Relationship mappings
- Validation rules
- State transition diagrams
- RLS policies for security
- Database migration scripts

**All entities align with**:
- Constitution Principle II (Security & Authentication)
- Constitution Principle V (Code Quality - proper error handling via constraints)
- Supabase best practices (RLS, indexes, triggers)

**Next**: Generate API contracts that operate on these entities.
