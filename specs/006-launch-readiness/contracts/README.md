# API Contracts: Launch Readiness

**Feature**: 006-launch-readiness | **Date**: 2025-10-27

## Overview

This directory contains OpenAPI 3.1 specifications for all new API endpoints introduced in the Launch Readiness feature. These contracts define request/response schemas, authentication requirements, error codes, and validation rules.

## Contract Files

1. **auth.openapi.yaml** - Authentication endpoints (signup, login, password reset)
2. **api-keys.openapi.yaml** - API key management endpoints (list, create, revoke)
3. **billing.openapi.yaml** - Billing & subscription endpoints (plans, checkout, manage)
4. **webhooks.openapi.yaml** - DodoPayments webhook contract (subscription events)
5. **docs.schema.json** - Documentation page structure and content schema

## Key Endpoints Summary

### Authentication Endpoints (Next.js API Routes)
- **POST /api/auth/signup** - Register new user
- **POST /api/auth/login** - Authenticate user
- **POST /api/auth/verify-email** - Verify email address
- **POST /api/auth/reset-password** - Initiate password reset
- **POST /api/auth/logout** - End user session

### API Key Endpoints (Next.js API Routes + Supabase RLS)
- **GET /api/api-keys** - List user's API keys
- **POST /api/api-keys** - Generate new API key
- **PATCH /api/api-keys/:id/revoke** - Revoke API key
- **GET /api/api-keys/:id/usage** - Get usage stats for key

### Billing Endpoints (Next.js API Routes)
- **GET /api/billing/plans** - List available subscription plans
- **POST /api/billing/checkout** - Create checkout session
- **GET /api/billing/subscription** - Get current subscription
- **POST /api/billing/cancel** - Cancel subscription
- **GET /api/billing/invoices** - List invoices

### Webhook Endpoints (Cloudflare Workers)
- **POST /api/webhooks/dodo** - DodoPayments webhook handler
  - Events: subscription.created, subscription.updated, subscription.cancelled, payment.succeeded, payment.failed

## Authentication

All user-facing endpoints use **Supabase Auth JWT tokens** in cookies:
```http
Cookie: sb-access-token=eyJhbGciOi...
Cookie: sb-refresh-token=eyJhbGciOi...
```

Worker endpoints (PDF generation) use **API keys** in Authorization header:
```http
Authorization: Bearer sk_live_a1b2c3d4e5f6...
```

Webhook endpoints use **signature verification** in X-Dodo-Signature header:
```http
X-Dodo-Signature: t=1234567890,v1=abc123...
X-Dodo-Timestamp: 1234567890
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response payload */ },
  "metadata": {
    "timestamp": "2025-10-27T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or revoked",
    "details": { /* additional context */ }
  },
  "metadata": {
    "timestamp": "2025-10-27T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_API_KEY | 401 | API key is invalid, revoked, or expired |
| QUOTA_EXCEEDED | 429 | User has exceeded their monthly PDF quota |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests from this IP/key |
| INVALID_HTML | 400 | HTML input is malformed or exceeds size limit |
| PAYMENT_REQUIRED | 402 | User must upgrade to access this feature |
| SUBSCRIPTION_NOT_FOUND | 404 | No active subscription found |
| WEBHOOK_SIGNATURE_INVALID | 401 | Webhook signature verification failed |
| SERVER_ERROR | 500 | Internal server error (logged to Sentry) |

## Validation Rules

### Email Format
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Max length: 255 characters
- Case-insensitive

### Password Strength
- Min length: 8 characters
- Must contain: 1 uppercase, 1 lowercase, 1 number

### API Key Name
- Min length: 1 character
- Max length: 50 characters
- Alphanumeric + spaces, hyphens, underscores

### HTML Input (PDF Generation)
- Max size: 1 MB
- Content-Type: text/html or application/json
- Encoding: UTF-8

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/signup | 5 requests | 1 hour per IP |
| POST /api/auth/login | 10 requests | 15 minutes per IP |
| POST /api/api-keys | 10 requests | 1 hour per user |
| POST /api/billing/checkout | 5 requests | 1 hour per user |
| POST /api/webhooks/dodo | 1000 requests | 1 minute (global) |
| POST /api/generate (Worker) | Tier-based | See quota limits |

## Webhook Event Payloads

### subscription.created
```json
{
  "id": "evt_abc123",
  "type": "subscription.created",
  "created": 1234567890,
  "data": {
    "subscription_id": "sub_xyz789",
    "customer_id": "cus_def456",
    "plan_id": "starter",
    "status": "active",
    "current_period_start": 1234567890,
    "current_period_end": 1237159890
  }
}
```

### payment.failed
```json
{
  "id": "evt_abc124",
  "type": "payment.failed",
  "created": 1234567890,
  "data": {
    "subscription_id": "sub_xyz789",
    "customer_id": "cus_def456",
    "amount": 2900,
    "currency": "usd",
    "failure_code": "card_declined",
    "failure_message": "Your card was declined"
  }
}
```

## Implementation Notes

1. **Supabase Auth Integration**: All auth endpoints proxy to Supabase Auth API
2. **RLS Enforcement**: API key and billing endpoints rely on Supabase RLS policies
3. **Webhook Idempotency**: All webhook events use idempotency keys to prevent duplicate processing
4. **Error Logging**: All 5xx errors are automatically captured by Sentry
5. **Response Caching**: Billing plan list (GET /api/billing/plans) cached for 1 hour

## Testing

Contract validation is automated in CI/CD:
```bash
# Validate OpenAPI specs
pnpm run validate:contracts

# Test contract compliance
pnpm run test:contracts
```

See [quickstart.md](../quickstart.md) for local development setup.

