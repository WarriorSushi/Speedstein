-- Migration: Add Payment Events Table
-- Created: 2025-10-27
-- Purpose: Audit log for DodoPayments webhook events with idempotency

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

-- Row Level Security Policies (admin only access)
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service can access payment events"
  ON payment_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
