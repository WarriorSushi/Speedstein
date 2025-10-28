# API Contracts: Constitution Compliance

**Feature**: Constitution Compliance - Production Readiness
**Date**: 2025-10-27

## Overview

This directory contains OpenAPI 3.1 specifications for all new API endpoints introduced by the Constitution Compliance feature. All contracts use Zod schemas for validation and are designed for implementation in Cloudflare Workers (backend) and Next.js 15 App Router (frontend).

## Contract Files

### 1. dodo-webhooks.yaml
DodoPayments webhook receiver endpoint for subscription events.

**Key Endpoints**:
- `POST /api/webhooks/dodo` - Receives subscription.created, payment.succeeded, payment.failed events
- Security: HMAC-SHA256 signature verification via `X-Dodo-Signature` header
- Idempotency: Uses `event_id` to prevent duplicate processing

### 2. subscription-api.yaml
Subscription management endpoints for user tier upgrades/downgrades.

**Key Endpoints**:
- `GET /api/subscription` - Fetch current user subscription details
- `POST /api/subscription` - Create new subscription (redirects to DodoPayments checkout)
- `PATCH /api/subscription` - Update subscription tier
- `DELETE /api/subscription` - Cancel subscription (effective at period end)
- Security: JWT bearer token (Supabase auth)

### 3. auth-flows.yaml
Authentication and user management endpoints.

**Key Endpoints**:
- `POST /api/auth/signup` - User registration with email/password
- `POST /api/auth/verify` - Email verification with token
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/logout` - Logout (invalidate session)
- `POST /api/auth/reset-password` - Password reset request
- `POST /api/auth/reset-password/confirm` - Password reset confirmation
- Security: Rate limiting (10 requests/minute), token expiration (24h verification, 1h reset)

## Implementation Notes

1. **Zod Validation**: All request/response schemas are defined using Zod and auto-generated to OpenAPI via `zod-to-openapi` library
2. **Error Handling**: All endpoints return `ApiError` format from `packages/shared/src/lib/errors.ts`
3. **Rate Limiting**: Authentication endpoints have rate limits defined in contracts
4. **CORS**: All endpoints support CORS with credentials (already configured in apps/worker/src/index.ts)
5. **Testing**: Integration tests in `tests/integration/` cover all contract scenarios

## Next Steps

- Implement Zod schemas in `packages/shared/src/schemas/`
- Generate OpenAPI specs using `pnpm run generate:openapi`
- Update `SPEEDSTEIN_API_REFERENCE.md` with new endpoints and multi-language examples
