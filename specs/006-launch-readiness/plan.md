# Implementation Plan: Compliance Fixes & MVP Launch Readiness

**Branch**: `006-launch-readiness` | **Date**: 2025-10-29 | **Spec**: [spec.md](spec.md)
**Input**: Complete all critical missing components from [PROJECT_COMPLIANCE_ANALYSIS.md](../../PROJECT_COMPLIANCE_ANALYSIS.md)

## Summary

This plan addresses **ALL** critical deviations identified in the comprehensive compliance analysis, systematically fixing P0 blockers, P1 missing features, and P2 polish items. The work is organized into 10 phases covering immediate fixes (4 hours), high-priority implementations (2 weeks), and polish (1 week). This represents completing the missing 68% of the original 50-step implementation plan, bringing the project from 62% to 100% compliance with specifications and constitution.

**Key Deliverables**:
- Fix pricing page quotas (P0 - 1 hour)
- Fix spec documentation errors (P0 - 15 min)
- Update constitution with deviations (P0 - 2 hours)
- Implement DodoPayments integration (P1 - 1 week)
- Implement rate limiting & usage tracking (P1 - 3 days)
- Configure Sentry monitoring (P1 - 1 day)
- Fix WebSocket RPC type errors (P1 - 3 days)
- Complete E2E test suite (P2 - 1 week)
- Complete OKLCH design system migration (P2 - 2 days)
- SEO & performance optimization (P2 - 3 days)

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18.17+, React 18, Next.js 15
**Primary Dependencies**:
- Frontend: Next.js 15 (App Router), React 18, Tailwind CSS 3.4, shadcn/ui, @sentry/nextjs 10.22.0, @supabase/ssr
- Backend: Cloudflare Workers, Hono 4.x, Cap'n Web RPC, @cloudflare/puppeteer, @sentry/cloudflare
- Payments: DodoPayments SDK (to be added)
- Database: Supabase PostgreSQL 15, @supabase/supabase-js 2.x
- Testing: Playwright 1.40+, Vitest 1.x

**Storage**:
- PostgreSQL 15 (Supabase hosted) - 4 tables with RLS
- Cloudflare R2 - PDF storage with tier-based lifecycle
- Cloudflare KV - Rate limiting counters

**Testing**:
- Unit: Vitest with 80%+ coverage target
- Integration: Supertest for API endpoints
- E2E: Playwright for user flows
- Performance: k6 or Artillery for load testing

**Target Platform**:
- Frontend: Vercel (Next.js deployment)
- Backend: Cloudflare Workers (global edge)
- Database: Supabase Cloud (PostgreSQL + Auth)

**Project Type**: Full-stack web application (monorepo with pnpm workspaces)

**Performance Goals**:
- P95 latency <2s for PDF generation
- Landing page LCP <2s
- Lighthouse score 95+ across all pages
- Browser reuse rate >80%

**Constraints**:
- Must use OKLCH colors exclusively (constitution mandate)
- Must use DodoPayments (constitution mandate)
- Must hash all API keys with SHA-256 (security requirement)
- Must implement RLS on all tables (multi-tenant security)
- Zero-downtime deployments required

**Scale/Scope**:
- 4 pricing tiers (Free, Starter, Pro, Enterprise)
- 27 frontend pages (already exist, need wiring)
- 6 API endpoints (already exist, need rate limiting/tracking)
- 8 user stories across 3 priority levels
- 50 implementation steps (32 complete, 18 remaining)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Performance Requirements (Principle I)
- [x] Feature design supports P95 latency <2s for PDF generation (already achieved: 1.8s measured)
- [x] Browser session reuse strategy documented (SimpleBrowserService with pooling)
- [x] Chrome instance warming approach defined (Durable Objects browser pooling)
- [ ] **ISSUE**: Promise pipelining broken due to type errors (PdfService/BrowserPool mismatch)
- [x] No blocking operations in critical path (async/await throughout)

**Action Required**: Fix WebSocket RPC type errors to restore promise pipelining (Phase 3)

### Security & Authentication (Principle II)
- [x] API keys will be SHA-256 hashed before storage (already implemented)
- [x] No plaintext secrets in code or configuration (using .env files)
- [x] RLS policies defined for all Supabase tables (12 policies implemented)
- [ ] **BLOCKER**: Rate limiting strategy NOT documented for endpoints
- [x] CORS configuration specified (wrangler.toml)
- [x] Environment variables identified for all secrets

**Action Required**: Implement rate limiting middleware (Phase 2)

### Design System Standards (Principle III)
- [x] All colors use OKLCH color space (tokens defined in globals.css)
- [ ] **ISSUE**: Some components still use RGB/hex colors (need audit)
- [ ] WCAG AAA contrast compliance NOT verified (Lighthouse not run)
- [x] Elevation system uses OKLCH lightness manipulation (design system exists)
- [x] Only shadcn/ui components used (no other UI libraries)

**Action Required**: Complete OKLCH migration and run accessibility audit (Phase 8)

### Technology Stack (Principle IV)
- [x] Frontend uses Next.js 15 with App Router (verified)
- [x] Backend uses Cloudflare Workers (deployed to production)
- [x] RPC uses Cap'n Web for PDF generation (type errors need fixing)
- [x] Database uses Supabase with RLS (fully configured)
- [ ] **BLOCKER**: Payments do NOT use DodoPayments (0% implemented)
- [x] Styling uses Tailwind CSS with OKLCH tokens

**Action Required**: Implement DodoPayments integration (Phase 4-5) - CRITICAL BLOCKER

### Code Quality (Principle V)
- [x] TypeScript strict mode enabled (verified in tsconfig.json)
- [x] Error handling strategy documented (try-catch throughout)
- [x] No console.log in production code paths (verified)
- [x] Zod schemas defined for API validation (existing)
- [x] Browser instance disposal strategy documented (using 'using' keyword)

**Status**: ✅ COMPLIANT

### Cap'n Web Best Practices (Principle VI)
- [x] Server classes extend RpcTarget (PdfService extends RpcTarget)
- [ ] **ISSUE**: Promise pipelining broken due to type mismatch
- [x] Resource disposal using 'using' keyword or Symbol.dispose() (implemented)
- [ ] **ISSUE**: WebSocket heartbeat mechanism NOT implemented
- [x] No event loop blocking operations

**Action Required**: Fix RPC type errors and implement heartbeat (Phase 3)

### User Experience (Principle VII)
- [ ] **UNKNOWN**: Landing page load time target <2s (LCP) - Lighthouse not run
- [x] Live demo works without authentication (Monaco editor exists)
- [x] Dark mode support included (theme toggle implemented)
- [x] Mobile-responsive design (breakpoints: 640/768/1024/1280px) - Tailwind configured
- [ ] **UNKNOWN**: Lighthouse score target 95+ NOT documented/validated

**Action Required**: Run Lighthouse and optimize performance (Phase 9)

### Testing & Quality (Principle VIII)
- [x] Unit tests planned for business logic (Vitest configured)
- [x] Integration tests planned for API endpoints (test infrastructure exists)
- [ ] **CRITICAL**: E2E tests SEVERELY incomplete (only 1 file, need 8+ files)
- [ ] **UNKNOWN**: 80%+ code coverage target NOT measured
- [ ] Link validation strategy NOT documented

**Action Required**: Complete E2E test suite (Phase 7) - HIGH PRIORITY

### Documentation (Principle IX)
- [x] API endpoints documented in SPEEDSTEIN_API_REFERENCE.md (complete)
- [x] Code examples for JS, Python, PHP, Ruby (22 doc pages exist)
- [ ] README updates identified (outdated claims need correction - Phase 0)
- [x] Complex logic has inline comments (verified in codebase)
- [x] Public functions have JSDoc/TSDoc (verified)

**Action Required**: Update README with accurate status (Phase 0)

### Deployment & Operations (Principle X)
- [x] Zero-downtime deployment strategy documented (Cloudflare rolling deployments)
- [ ] **BLOCKER**: Sentry error tracking NOT configured (installed but DSN missing)
- [ ] **BLOCKER**: 99.9% uptime monitoring NOT planned (no UptimeRobot/Pingdom)
- [x] Structured logging for critical operations (Cloudflare Workers logs)
- [x] Environment variables for configuration (all secrets in .env files)

**Action Required**: Configure Sentry and uptime monitoring (Phase 6) - CRITICAL BLOCKER

**GATE VERDICT**: ❌ FAILED - 5 CRITICAL BLOCKERS identified:
1. DodoPayments NOT implemented (Principle IV violation)
2. Rate limiting NOT implemented (Principle II violation)
3. Sentry NOT configured (Principle X violation)
4. E2E tests incomplete (Principle VIII violation)
5. Performance NOT validated (Principle VII violation)

**Proceed to Phase 0**: Yes - with plan to resolve all blockers in subsequent phases

## Project Structure

### Documentation (this feature)

```text
specs/006-launch-readiness/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output - technical research & decisions
├── data-model.md        # Phase 1 output - database schema updates
├── quickstart.md        # Phase 1 output - developer setup guide
├── contracts/           # Phase 1 output - API contracts
│   ├── dodo-webhooks.openapi.yaml
│   ├── rate-limiting.openapi.yaml
│   └── usage-tracking.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created yet)
```

### Source Code (repository root)

```text
speedstein/
├── apps/
│   ├── web/                           # Next.js 15 frontend (already exists)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/           # ✅ Exists (login, signup pages)
│   │   │   │   ├── (dashboard)/      # ✅ Exists (dashboard, api-keys, billing)
│   │   │   │   ├── (marketing)/      # ✅ Exists (landing, pricing, docs)
│   │   │   │   ├── api/              # ⚠️ Partial (generate exists, webhooks missing)
│   │   │   │   │   ├── generate/     # ✅ Exists
│   │   │   │   │   └── webhooks/     # ❌ TO ADD
│   │   │   │   │       └── dodo/     # ❌ TO ADD (Phase 5)
│   │   │   │   └── checkout/         # ❌ TO ADD (Phase 4)
│   │   │   ├── components/
│   │   │   │   ├── ui/               # ✅ Exists (shadcn/ui)
│   │   │   │   ├── auth/             # ⚠️ Partial (forms exist, wiring needed)
│   │   │   │   ├── dashboard/        # ✅ Exists
│   │   │   │   └── monaco-demo.tsx   # ✅ Exists
│   │   │   ├── hooks/                # ⚠️ Partial (need payment hooks)
│   │   │   │   ├── use-subscription.ts  # ✅ Exists
│   │   │   │   └── use-checkout.ts      # ❌ TO ADD (Phase 4)
│   │   │   └── lib/
│   │   │       ├── supabase/         # ✅ Exists (client/server)
│   │   │       └── dodo.ts           # ❌ TO ADD (Phase 4)
│   │   ├── sentry.client.config.ts   # ⚠️ Exists but NOT configured
│   │   ├── sentry.edge.config.ts     # ⚠️ Exists but NOT configured
│   │   └── .env.local                # ⚠️ Missing SENTRY_DSN, DODO keys
│   │
│   └── worker/                        # Cloudflare Worker (already exists)
│       ├── src/
│       │   ├── index.ts              # ✅ Exists (main entry point)
│       │   ├── routes/
│       │   │   ├── generate.ts       # ✅ Exists (needs rate limiting + usage tracking)
│       │   │   └── batch.ts          # ✅ Exists (needs fixing)
│       │   ├── middleware/           # ⚠️ Partial
│       │   │   ├── auth.ts           # ✅ Exists
│       │   │   ├── rate-limit.ts     # ❌ TO ADD (Phase 2)
│       │   │   └── usage-tracking.ts # ❌ TO ADD (Phase 2)
│       │   ├── services/
│       │   │   ├── pdf.ts            # ✅ Exists (needs type fix)
│       │   │   ├── browser.ts        # ✅ Exists
│       │   │   └── sentry.ts         # ❌ TO ADD (Phase 6)
│       │   └── lib/
│       │       ├── pricing-config.ts # ✅ CORRECT (fixed Oct 26)
│       │       └── rate-limiter.ts   # ❌ TO ADD (Phase 2)
│       └── .dev.vars                 # ⚠️ Missing SENTRY_DSN
│
├── packages/
│   ├── shared/                       # Shared types (already exists)
│   │   └── src/
│   │       └── types/
│   │           ├── user.ts           # ✅ Exists (TIER_QUOTAS correct)
│   │           └── payment.ts        # ❌ TO ADD (Phase 4)
│   │
│   └── database/                     # Supabase migrations (already exists)
│       └── src/
│           └── database.types.ts     # ✅ Exists (auto-generated)
│
├── tests/
│   ├── e2e/                          # ❌ SEVERELY INCOMPLETE
│   │   ├── demo.spec.ts              # ✅ Exists (only 1 file!)
│   │   ├── auth.spec.ts              # ❌ TO ADD (Phase 7)
│   │   ├── api-keys.spec.ts          # ❌ TO ADD (Phase 7)
│   │   ├── pdf-generation.spec.ts    # ❌ TO ADD (Phase 7)
│   │   ├── payments.spec.ts          # ❌ TO ADD (Phase 7)
│   │   └── rate-limiting.spec.ts     # ❌ TO ADD (Phase 7)
│   ├── integration/                  # ⚠️ Partial
│   │   └── api/                      # ⚠️ Some tests exist
│   └── unit/                         # ⚠️ Partial
│
├── supabase/
│   ├── migrations/                   # ✅ Complete (4 tables with RLS)
│   └── config.toml                   # ✅ Exists
│
├── .specify/
│   └── memory/
│       └── constitution.md           # ⚠️ Needs deviations section (Phase 0)
│
├── specs/
│   ├── 001-pdf-api-platform/         # ✅ Complete
│   ├── 002-architecture-alignment/   # ✅ Complete
│   ├── 003-production-readiness/     # ✅ Complete
│   ├── 004-architecture-alignment/   # ❌ DELETE (duplicate - Phase 0)
│   ├── 005-constitution-compliance/  # ⚠️ Partial
│   └── 006-launch-readiness/         # 📝 This feature
│
├── README.md                          # ⚠️ Needs status update (Phase 0)
├── PROJECT_COMPLIANCE_ANALYSIS.md     # ✅ Complete (source of truth)
└── IMMEDIATE_ACTION_PLAN.md           # ✅ Complete (P0 actions)
```

## Phase Breakdown

### Phase 0: Immediate Fixes (P0 - CRITICAL) - 4 hours

**Purpose**: Fix critical inaccuracies and documentation errors that mislead developers and customers.

**Tasks**:
1. **Fix Pricing Page Quotas** (1 hour)
   - File: `apps/web/src/app/(marketing)/pricing/page.tsx`
   - Changes: Starter 1K→5K, Pro $99/10K→$149/50K, Enterprise Custom/100K+→$499/500K
   - Verification: View /pricing page, compare to pricing-config.ts

2. **Fix Spec 006 Enterprise Pricing** (10 min)
   - File: `specs/006-launch-readiness/spec.md`
   - Change: Line 56, 197 - $999→$499
   - Verification: `grep -n "999" spec.md` returns no results

3. **Remove Duplicate Spec Directory** (5 min)
   - Command: `rm -rf specs/004-architecture-alignment/`
   - Verification: `ls specs/` shows 001, 002, 003, 005, 006 only

4. **Update Constitution with Deviations** (2 hours)
   - File: `.specify/memory/constitution.md`
   - Add "Current Deviations & Waivers" section (see IMMEDIATE_ACTION_PLAN.md)
   - Document 4 principle violations with waivers
   - Bump version to 1.1.0

5. **Update README.md** (30 min)
   - File: `README.md`
   - Replace lines 8-24 with accurate status (see IMMEDIATE_ACTION_PLAN.md)
   - Link to PROJECT_COMPLIANCE_ANALYSIS.md
   - Remove misleading claims

6. **Commit P0 Fixes** (15 min)
   - Git commit with message documenting all changes
   - Push to 006-launch-readiness branch

**Deliverables**: All P0 inaccuracies fixed, constitution updated with waivers, README accurate

**Constitution Gate**: Still FAILED (P1 blockers remain), but documentation now accurate

---

### Phase 1: Research & Planning (P1 Prerequisites) - 8 hours

**Purpose**: Research technical approaches for missing features, document decisions, and create contracts.

**Tasks**:
1. **Research DodoPayments Integration** (2 hours)
   - Study DodoPayments API docs (checkout, webhooks, subscription management)
   - Research webhook signature verification methods
   - Identify best practices for idempotent webhook handling
   - Document SDK installation and configuration

2. **Research Rate Limiting Strategies** (1 hour)
   - Study Cloudflare KV-based rate limiting patterns
   - Research sliding window vs. token bucket algorithms
   - Identify best practices for distributed rate limiting
   - Document per-tier rate limits from pricing-config.ts

3. **Research Usage Tracking Patterns** (1 hour)
   - Study efficient usage recording strategies
   - Research batch vs. real-time tracking trade-offs
   - Identify Supabase best practices for high-write tables
   - Document quota enforcement logic

4. **Research Sentry Configuration** (1 hour)
   - Study Sentry Next.js integration best practices
   - Research Cloudflare Workers Sentry integration
   - Identify error boundary patterns for React
   - Document alerting rules and notification channels

5. **Research WebSocket RPC Type Fixes** (1 hour)
   - Analyze PdfService/BrowserPool type mismatch
   - Research Cap'n Web typing patterns
   - Identify promise pipelining best practices
   - Document fix approach

6. **Research E2E Testing Patterns** (1 hour)
   - Study Playwright best practices for auth flows
   - Research test email services (Mailosaur, test SMTP)
   - Identify DodoPayments sandbox testing approach
   - Document test data management strategy

7. **Generate research.md** (1 hour)
   - Consolidate all research findings
   - Document decisions and rationale
   - List alternatives considered
   - Create technical decision records (TDRs)

**Deliverables**: `research.md` with all technical decisions documented

---

### Phase 2: Rate Limiting & Usage Tracking (P1 - HIGH) - 3 days

**Purpose**: Prevent API abuse and enable quota enforcement (BLOCKING for public launch).

**Tasks**:
1. **Create Rate Limiter Service** (4 hours)
   - File: `apps/worker/src/lib/rate-limiter.ts`
   - Implement sliding window algorithm using Cloudflare KV
   - Support per-tier rate limits (10, 100, 1000, 10000 req/min)
   - Return rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
   - Handle KV failures gracefully (fail open with warning)

2. **Create Rate Limiting Middleware** (2 hours)
   - File: `apps/worker/src/middleware/rate-limit.ts`
   - Integrate rate limiter service
   - Return 429 status with Retry-After header
   - Include tier upgrade suggestion in error response
   - Log rate limit violations

3. **Create Usage Tracking Middleware** (3 hours)
   - File: `apps/worker/src/middleware/usage-tracking.ts`
   - Record usage after successful PDF generation
   - Insert into `usage_records` table (user_id, api_key_id, pdf_size, created_at)
   - Update `usage_quotas.pdfs_generated` counter
   - Check quota remaining before allowing request

4. **Integrate Middleware into Routes** (2 hours)
   - Update `apps/worker/src/routes/generate.ts`
   - Add rate-limit → auth → usage-check → generate → usage-track pipeline
   - Update `apps/worker/src/routes/batch.ts`
   - Test with curl scripts

5. **Write Integration Tests** (3 hours)
   - File: `tests/integration/rate-limiting.spec.ts`
   - Test rate limit enforcement per tier
   - Test quota enforcement per tier
   - Test 429 responses
   - Test usage recording

6. **Update API Docs** (1 hour)
   - Update SPEEDSTEIN_API_REFERENCE.md
   - Document rate limit headers
   - Document quota exceeded error response
   - Add troubleshooting section

**Deliverables**: Rate limiting and usage tracking fully implemented and tested

**Constitution Gate Check**: Principle II (Security) now closer to compliance

---

### Phase 3: WebSocket RPC Type Fixes (P1 - HIGH) - 3 days

**Purpose**: Fix type errors blocking promise pipelining (Enterprise feature).

**Tasks**:
1. **Analyze Type Mismatch** (2 hours)
   - Review `apps/worker/src/services/pdf.ts`
   - Review `apps/worker/src/services/browser.ts`
   - Identify interface mismatch between PdfService and BrowserPool
   - Document current vs. expected types

2. **Create Unified Browser Service Interface** (4 hours)
   - Create `apps/worker/src/services/browser-interface.ts`
   - Define common interface for SimpleBrowserService and BrowserPool
   - Update PdfService to accept interface instead of concrete type
   - Ensure type safety without `as any` casts

3. **Implement Promise Pipelining** (6 hours)
   - Update batch generation to use Cap'n Web promise pipelining
   - Chain dependent operations (browser.getPage() → page.setContent() → page.pdf())
   - Measure latency improvement (expect 30-50% reduction)
   - Document pipelining patterns in code comments

4. **Add WebSocket Heartbeat** (2 hours)
   - Implement ping/pong mechanism every 30 seconds
   - Handle heartbeat timeouts (reconnect logic)
   - Log heartbeat failures

5. **Write RPC Tests** (2 hours)
   - File: `tests/integration/websocket-rpc.spec.ts`
   - Test single PDF generation via RPC
   - Test batch generation via RPC
   - Test promise pipelining
   - Measure latency vs. REST API

6. **Remove `as any` Suppressions** (1 hour)
   - Search for `as any` in RPC code
   - Replace with proper types
   - Verify TypeScript compilation succeeds

**Deliverables**: WebSocket RPC fully functional with promise pipelining

**Constitution Gate Check**: Principle VI (Cap'n Web Best Practices) now compliant

---

### Phase 4: DodoPayments SDK Integration (P1 - CRITICAL) - 4 days

**Purpose**: Enable revenue generation (BLOCKING for monetization).

**Tasks**:
1. **Install DodoPayments SDK** (30 min)
   - Run `pnpm add dodopayments` in apps/web
   - Add DODO_PUBLISHABLE_KEY, DODO_SECRET_KEY to .env.local (PLACEHOLDER)
   - Add DODO_WEBHOOK_SECRET to .env.local (PLACEHOLDER)
   - Document in CREDENTIALS_NEEDED.md

2. **Create DodoPayments Client** (2 hours)
   - File: `apps/web/src/lib/dodo.ts`
   - Initialize DodoPayments client with API keys
   - Create helper functions: createCheckoutSession(), retrieveSession()
   - Handle errors gracefully

3. **Create Checkout Page** (6 hours)
   - File: `apps/web/src/app/checkout/page.tsx`
   - Accept `tier` query param (starter, pro, enterprise)
   - Create checkout session with DodoPayments
   - Redirect to DodoPayments hosted checkout page
   - Handle success/cancel redirects

4. **Update Billing Page** (3 hours)
   - File: `apps/web/src/app/(dashboard)/billing/page.tsx`
   - Remove "Coming Soon" placeholder
   - Add "Upgrade" buttons for each tier
   - Link to /checkout?tier=X
   - Show current subscription status

5. **Create Payment Hook** (2 hours)
   - File: `apps/web/src/hooks/use-checkout.ts`
   - Handle checkout creation
   - Manage loading/error states
   - Redirect to success page after payment

6. **Write Checkout Tests** (2 hours)
   - File: `tests/e2e/checkout.spec.ts`
   - Test checkout flow (click upgrade → redirect to Dodo → success)
   - Use DodoPayments sandbox mode
   - Verify subscription updates in database

**Deliverables**: Checkout flow complete (webhooks in Phase 5)

**Constitution Gate Check**: Principle IV (Tech Stack) - 50% progress (checkout done, webhooks pending)

---

### Phase 5: DodoPayments Webhook Handler (P1 - CRITICAL) - 3 days

**Purpose**: Handle subscription lifecycle events (BLOCKING for monetization).

**Tasks**:
1. **Create Webhook Route** (3 hours)
   - File: `apps/web/src/app/api/webhooks/dodo/route.ts`
   - Accept POST requests from DodoPayments
   - Verify webhook signatures using DODO_WEBHOOK_SECRET
   - Parse event payload

2. **Implement Event Handlers** (8 hours)
   - Handle `subscription.created` event
     - Create subscription record in `subscriptions` table
     - Update `usage_quotas` with new tier limits
     - Send confirmation email
   - Handle `subscription.updated` event
     - Update subscription record (status, current_period_end)
     - Adjust quotas if tier changed
   - Handle `subscription.cancelled` event
     - Set status to "cancelled"
     - Schedule downgrade to free tier at period end
   - Handle `payment.succeeded` event
     - Set subscription status to "active"
     - Log payment in `invoices` table (if table exists)
   - Handle `payment.failed` event
     - Set subscription status to "past_due"
     - Send dunning email to user
   - Return 200 OK for all events

3. **Implement Idempotency** (3 hours)
   - Use event ID as idempotency key
   - Check if event already processed (query by event_id)
   - Skip processing if duplicate
   - Return 200 OK anyway

4. **Add Webhook Logging** (1 hour)
   - Log all webhook events to console (dev)
   - Log to Sentry (production, Phase 6)
   - Include event type, status, processing time

5. **Write Webhook Tests** (3 hours)
   - File: `tests/integration/dodo-webhooks.spec.ts`
   - Test each event type
   - Test signature verification
   - Test idempotency
   - Test database updates

6. **Configure Webhook URL in DodoPayments Dashboard** (30 min)
   - URL: `https://speedstein.com/api/webhooks/dodo`
   - Document in CREDENTIALS_NEEDED.md
   - Test with DodoPayments test events

**Deliverables**: Full DodoPayments integration (checkout + webhooks)

**Constitution Gate Check**: Principle IV (Tech Stack) now COMPLIANT

---

### Phase 6: Sentry Configuration (P1 - CRITICAL) - 1 day

**Purpose**: Enable error tracking and alerting (BLOCKING for production).

**Tasks**:
1. **Create Sentry Project** (30 min)
   - Sign up at sentry.io (PLACEHOLDER)
   - Create project "speedstein-frontend"
   - Create project "speedstein-worker"
   - Copy DSNs to CREDENTIALS_NEEDED.md

2. **Configure Sentry in Next.js** (2 hours)
   - Update `apps/web/sentry.client.config.ts`
     - Add dsn: process.env.NEXT_PUBLIC_SENTRY_DSN
     - Add tracesSampleRate: 0.1 (10% performance sampling)
     - Add replaysSessionSampleRate: 0.1
     - Add replaysOnErrorSampleRate: 1.0
   - Update `apps/web/sentry.edge.config.ts` (same config)
   - Add NEXT_PUBLIC_SENTRY_DSN to .env.local (PLACEHOLDER)
   - Test by triggering an error

3. **Add Error Boundaries** (2 hours)
   - Create `apps/web/src/components/error-boundary.tsx`
   - Wrap app in ErrorBoundary
   - Show user-friendly error message
   - Report errors to Sentry

4. **Configure Sentry in Worker** (2 hours)
   - Install `@sentry/cloudflare`
   - Create `apps/worker/src/services/sentry.ts`
   - Initialize Sentry in worker entry point
   - Wrap route handlers with Sentry.captureException()
   - Add SENTRY_DSN to .dev.vars and wrangler.toml (PLACEHOLDER)

5. **Add Alerting Rules** (1 hour)
   - Configure alert for errors >10/min
   - Configure alert for P95 latency >3s
   - Set up notification channel (email or Slack) - PLACEHOLDER
   - Document in CREDENTIALS_NEEDED.md

6. **Write Sentry Tests** (1 hour)
   - Trigger test error in frontend
   - Trigger test error in worker
   - Verify errors appear in Sentry dashboard
   - Verify alert fires

**Deliverables**: Sentry fully configured and tested

**Constitution Gate Check**: Principle X (Deployment & Operations) - 50% progress (monitoring pending)

---

### Phase 7: E2E Test Suite (P2 - HIGH RISK) - 5 days

**Purpose**: Automated verification of critical user flows (regression prevention).

**Tasks**:
1. **Setup Test Infrastructure** (2 hours)
   - Configure Playwright for Supabase Auth
   - Set up test email service (Mailosaur or similar) - PLACEHOLDER
   - Create test user factory
   - Configure DodoPayments sandbox credentials - PLACEHOLDER

2. **Auth Flow Tests** (6 hours)
   - File: `tests/e2e/auth.spec.ts`
   - Test signup flow (form validation, email verification)
   - Test login flow (success, wrong password, unverified email)
   - Test logout flow
   - Test password reset flow
   - Test protected routes redirect to login

3. **API Keys Tests** (4 hours)
   - File: `tests/e2e/api-keys.spec.ts`
   - Test API key generation (name required, key displayed once)
   - Test API key list (shows prefix, created_at, last_used)
   - Test API key revocation (confirm dialog, immediate deactivation)
   - Test max 10 keys limit

4. **PDF Generation Tests** (6 hours)
   - File: `tests/e2e/pdf-generation.spec.ts`
   - Test single PDF generation (valid HTML → download PDF)
   - Test batch PDF generation (multiple HTMLs → multiple PDFs)
   - Test rate limiting (exceed limit → 429 error)
   - Test quota enforcement (exceed quota → quota error)

5. **Payment Flow Tests** (8 hours)
   - File: `tests/e2e/payments.spec.ts`
   - Test upgrade flow (click upgrade → redirect to Dodo → webhook → subscription updated)
   - Test downgrade flow (cancel subscription → remains active until period end → downgrades)
   - Test payment failure (webhook → subscription past_due → user notified)
   - Use DodoPayments sandbox with test cards

6. **Dashboard Tests** (4 hours)
   - File: `tests/e2e/dashboard.spec.ts`
   - Test dashboard overview (shows tier, usage, quota)
   - Test usage page (shows usage history)
   - Test billing page (shows subscription details)
   - Test settings page

7. **CI Integration** (2 hours)
   - Add Playwright to GitHub Actions (or equivalent)
   - Run E2E tests on PR
   - Block merge if critical tests fail
   - Upload test artifacts (screenshots, videos, traces)

**Deliverables**: Comprehensive E2E test suite (6 test files, ~30 tests)

**Constitution Gate Check**: Principle VIII (Testing & Quality) now COMPLIANT

---

### Phase 8: OKLCH Design System Completion (P2 - POLISH) - 2 days

**Purpose**: Ensure consistent, accessible design system (brand quality + legal compliance).

**Tasks**:
1. **Audit for Non-OKLCH Colors** (3 hours)
   - Search codebase for `#` (hex colors)
   - Search for `rgb\(` (RGB colors)
   - Search for `hsl\(` (HSL colors)
   - Document all violations in spreadsheet

2. **Replace Non-OKLCH Colors** (6 hours)
   - For each violation:
     - Convert to OKLCH using oklch.com calculator
     - Add to globals.css as CSS custom property
     - Update component to use custom property
   - Verify no hex/RGB/HSL colors remain

3. **Run Accessibility Audit** (2 hours)
   - Run axe DevTools on all pages
   - Check WCAG AAA contrast compliance (7:1 normal, 4.5:1 large)
   - Fix any contrast violations
   - Document results

4. **Generate Design System Docs** (2 hours)
   - Create `apps/web/src/app/(marketing)/design-system/page.tsx`
   - Show all OKLCH color tokens with swatches
   - Show elevation levels with examples
   - Document usage guidelines
   - Include dark mode toggle demo

5. **Verify Dark Mode** (1 hour)
   - Toggle dark mode on all pages
   - Verify colors transform smoothly
   - Verify perceptual consistency
   - Fix any dark mode issues

**Deliverables**: 100% OKLCH design system, documented

**Constitution Gate Check**: Principle III (Design System Standards) now COMPLIANT

---

### Phase 9: SEO & Performance Optimization (P2 - POLISH) - 3 days

**Purpose**: Achieve Lighthouse 95+ and <2s LCP (UX and SEO).

**Tasks**:
1. **Add Metadata to All Pages** (4 hours)
   - Update each page.tsx with metadata export
   - Add title, description, og:image, twitter:card
   - Use dynamic metadata for user-specific pages

2. **Create Sitemap** (1 hour)
   - File: `apps/web/src/app/sitemap.xml/route.ts`
   - Generate sitemap with all public pages
   - Include priority and changefreq

3. **Create Robots.txt** (30 min)
   - File: `apps/web/src/app/robots.txt/route.ts`
   - Allow all crawlers
   - Link to sitemap

4. **Add Structured Data** (2 hours)
   - Add JSON-LD schema to landing page (Organization, Product)
   - Add JSON-LD to pricing page (Offer)
   - Add JSON-LD to docs pages (TechArticle)

5. **Run Lighthouse on All Pages** (3 hours)
   - Test landing, pricing, docs, dashboard
   - Document scores
   - Identify performance bottlenecks

6. **Optimize Images** (2 hours)
   - Convert images to WebP
   - Add width/height attributes
   - Lazy load below-the-fold images

7. **Optimize Bundle Size** (3 hours)
   - Analyze bundle with next-bundle-analyzer
   - Code-split large dependencies
   - Tree-shake unused code
   - Defer non-critical JS

8. **Measure Performance** (2 hours)
   - Run load tests with k6 or Artillery
   - Measure P50/P95/P99 latency
   - Verify P95 <2s target
   - Document results

9. **Re-run Lighthouse** (1 hour)
   - Verify all pages score 95+
   - Fix any regressions
   - Document final scores

**Deliverables**: Lighthouse 95+ on all pages, P95 <2s validated

**Constitution Gate Check**: Principle VII (User Experience) now COMPLIANT

---

### Phase 10: Final Validation & Launch Prep (P2 - LAUNCH) - 2 days

**Purpose**: Final checks before MVP launch.

**Tasks**:
1. **Run Full Test Suite** (2 hours)
   - Unit tests: `pnpm test`
   - Integration tests: `pnpm test:integration`
   - E2E tests: `pnpm test:e2e`
   - Verify all pass

2. **Manual QA Checklist** (4 hours)
   - Test signup → login → generate API key → make PDF → upgrade → cancel
   - Test on Chrome, Firefox, Safari
   - Test on mobile (iOS, Android)
   - Document any issues

3. **Security Audit** (3 hours)
   - Verify all API keys hashed
   - Verify RLS policies prevent cross-tenant access
   - Verify rate limiting works
   - Verify webhook signatures verified
   - Test common vulnerabilities (SQL injection, XSS)

4. **Performance Validation** (2 hours)
   - Run load test (100 concurrent users)
   - Verify P95 <2s
   - Verify browser reuse >80%
   - Document results

5. **Deploy to Production** (2 hours)
   - Deploy frontend to Vercel: `vercel --prod`
   - Deploy worker to Cloudflare: `wrangler deploy`
   - Run database migrations: `supabase db push`
   - Verify production works

6. **Configure Monitoring** (2 hours)
   - Set up UptimeRobot (or Pingdom) - PLACEHOLDER
   - Monitor https://api.speedstein.com/health
   - Configure alerts for downtime
   - Document in CREDENTIALS_NEEDED.md

7. **Update Documentation** (1 hour)
   - Mark all tasks as complete
   - Update README with launch announcement
   - Update CHANGELOG
   - Create launch blog post (optional)

**Deliverables**: MVP launched to production, all monitoring configured

**Constitution Gate Check**: ✅ ALL PRINCIPLES COMPLIANT

---

## Complexity Tracking

| Complexity Factor | Justification |
|------------------|---------------|
| **DodoPayments Integration** | Required by constitution (Principle IV). Adds webhook complexity but enables revenue. Alternative (Stripe) not allowed. |
| **Rate Limiting with Cloudflare KV** | Required by constitution (Principle II). Distributed system adds complexity but necessary for abuse prevention. |
| **WebSocket RPC Type Fixes** | Existing feature needs fixing. Complexity unavoidable due to Cap'n Web typing model. Alternative (remove RPC) degrades performance. |
| **E2E Test Suite** | Required by constitution (Principle VIII, 80% coverage). Adds maintenance burden but critical for regression prevention. |
| **OKLCH Design System** | Required by constitution (Principle III, non-negotiable). Adds complexity vs. RGB but necessary for accessibility compliance. |
| **Sentry Integration** | Required by constitution (Principle X). Adds dependency but critical for production monitoring. |

**Overall Assessment**: Complexity is justified by constitution requirements and production readiness needs. No simpler alternatives available within constraints.

---

## Constitution Re-Check (Post-Design)

After completing all phases:

### Performance Requirements (Principle I)
- [x] P95 latency <2s validated via load testing (Phase 9)
- [x] Browser session reuse measured >80% (Phase 9)
- [x] Promise pipelining restored (Phase 3)
- [x] No blocking operations in critical path (verified)

### Security & Authentication (Principle II)
- [x] API keys SHA-256 hashed (already done)
- [x] RLS policies enforced (verified in Phase 10)
- [x] Rate limiting implemented (Phase 2)
- [x] CORS configured (already done)
- [x] All secrets in environment variables (Phase 0-6)

### Design System Standards (Principle III)
- [x] 100% OKLCH colors (Phase 8)
- [x] WCAG AAA contrast verified (Phase 8)
- [x] Elevation system uses OKLCH (Phase 8)
- [x] Only shadcn/ui components (verified)

### Technology Stack (Principle IV)
- [x] Next.js 15 with App Router (verified)
- [x] Cloudflare Workers (deployed)
- [x] Cap'n Web RPC (fixed in Phase 3)
- [x] Supabase with RLS (verified)
- [x] DodoPayments integrated (Phase 4-5) ✅ CRITICAL
- [x] Tailwind CSS with OKLCH (verified)

### Code Quality (Principle V)
- [x] TypeScript strict mode (verified)
- [x] Error handling throughout (verified)
- [x] No console.log in production (verified)
- [x] Zod schemas (verified)
- [x] Browser disposal (verified)

### Cap'n Web Best Practices (Principle VI)
- [x] RpcTarget extended (verified)
- [x] Promise pipelining working (Phase 3)
- [x] Resource disposal (verified)
- [x] WebSocket heartbeat (Phase 3)
- [x] No event loop blocking (verified)

### User Experience (Principle VII)
- [x] Landing page LCP <2s (Phase 9)
- [x] Live demo works (verified)
- [x] Dark mode (verified)
- [x] Mobile-responsive (verified)
- [x] Lighthouse 95+ (Phase 9)

### Testing & Quality (Principle VIII)
- [x] Unit tests for business logic (existing + new)
- [x] Integration tests for API endpoints (existing + Phase 2, 5)
- [x] E2E tests for user flows (Phase 7) ✅ CRITICAL
- [x] 80%+ coverage (measured in Phase 10)
- [x] No broken links (verified)

### Documentation (Principle IX)
- [x] API endpoints documented (verified)
- [x] Multi-language examples (verified)
- [x] README accurate (Phase 0)
- [x] Inline comments (verified)
- [x] JSDoc/TSDoc (verified)

### Deployment & Operations (Principle X)
- [x] Zero-downtime deployments (Cloudflare/Vercel)
- [x] Sentry configured (Phase 6) ✅ CRITICAL
- [x] 99.9% uptime monitoring (Phase 10) ✅ CRITICAL
- [x] Structured logging (verified)
- [x] Environment variables (verified)

**FINAL GATE VERDICT**: ✅ PASSED - All 10 principles compliant after Phase 10 completion

---

## Success Criteria

**This implementation is successful when**:

1. ✅ All P0 fixes deployed (pricing page, spec corrections, constitution updated)
2. ✅ DodoPayments fully integrated (checkout + webhooks working in production)
3. ✅ Rate limiting prevents abuse (tested with 1000 req/min load test)
4. ✅ Usage tracking enforces quotas (tested by exceeding free tier limit)
5. ✅ Sentry captures errors (tested by triggering production error)
6. ✅ WebSocket RPC works without type errors (tested with batch generation)
7. ✅ E2E tests pass (30+ tests covering auth, payments, PDF generation)
8. ✅ OKLCH design system 100% complete (no hex/RGB/HSL colors remain)
9. ✅ Lighthouse scores 95+ on all pages (landing, pricing, docs, dashboard)
10. ✅ P95 latency <2s validated (load test with 100 concurrent users)
11. ✅ Constitution compliance 100% (all 10 principles met, waivers resolved)
12. ✅ MVP launched to production (frontend on Vercel, worker on Cloudflare)

**Timeline**: 3-4 weeks (P0: 4 hours, P1: 2 weeks, P2: 1 week, Launch: 2 days)

**Team**: Solo developer or small team (2-3 developers can parallelize phases)

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| DodoPayments sandbox credentials unavailable | Medium | High | Use Stripe sandbox as temporary alternative, document DodoPayments as TODO |
| Sentry DSN not obtained | Low | Medium | Use console.log fallback, document Sentry as TODO |
| E2E tests flaky | Medium | Medium | Use test retries (max 3), document flaky tests, fix incrementally |
| WebSocket RPC fix breaks existing code | Low | High | Keep REST API working, make RPC fix backward-compatible, test thoroughly |
| Performance regression during optimization | Low | High | Measure before/after each change, rollback if P95 >2.5s |
| OKLCH migration breaks UI | Medium | Medium | Test each component after migration, keep hex fallbacks for legacy browsers |
| Rate limiting too aggressive | Medium | Low | Start conservative (2x documented limits), monitor false positives, adjust |
| Launch date slips | High | Medium | Prioritize P0/P1, defer P2 to post-launch if needed, communicate timeline changes |

---

## Dependencies & Blockers

**External Dependencies**:
- DodoPayments account + API keys (PLACEHOLDER - document in CREDENTIALS_NEEDED.md)
- Sentry account + DSN (PLACEHOLDER - document in CREDENTIALS_NEEDED.md)
- Test email service (Mailosaur) - optional (PLACEHOLDER - document in CREDENTIALS_NEEDED.md)
- UptimeRobot account (PLACEHOLDER - document in CREDENTIALS_NEEDED.md)

**Internal Dependencies**:
- Phase 2 (rate limiting) must complete before Phase 10 (security audit)
- Phase 4 (checkout) must complete before Phase 5 (webhooks)
- Phase 6 (Sentry config) must complete before Phase 10 (error monitoring)
- Phase 7 (E2E tests) can run in parallel with Phases 4-6
- Phase 8 (OKLCH) can run in parallel with Phases 4-7
- Phase 9 (SEO/performance) depends on Phases 4-8 completing

**No Blockers**: All work can start immediately after Phase 0 (P0 fixes)

---

## Next Steps

After `/speckit.plan` completes:

1. **Run** `/speckit.tasks` to generate detailed task breakdown (tasks.md)
2. **Review** CREDENTIALS_NEEDED.md for placeholder credentials
3. **Start Phase 0**: Fix P0 issues (4 hours)
4. **Start Phase 1**: Research (8 hours)
5. **Proceed sequentially** through Phases 2-10
6. **Update** constitution when all blockers resolved
7. **Launch** MVP to production

**Estimated Completion**: December 1, 2025 (3-4 weeks from today)
