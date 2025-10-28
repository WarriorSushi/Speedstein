# Tasks: Launch Readiness - Complete Critical MVP Components

**Input**: Design documents from `/specs/006-launch-readiness/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature includes comprehensive E2E, integration, and unit testing as specified in FR-035 through FR-042.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Priority 1 (P1) stories are BLOCKING items that must complete before launch.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `apps/web/`, `apps/worker/`, `packages/shared/`, `tests/`
- Paths based on plan.md structure (Next.js 15 App Router + Cloudflare Workers)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and environment configuration

- [X] T001 Install Supabase SSR package: `cd apps/web && pnpm add @supabase/ssr@0.5.2`
- [X] T002 [P] Install Sentry SDKs: `cd apps/web && pnpm add @sentry/nextjs` and `cd apps/worker && pnpm add @sentry/browser`
- [X] T003 [P] Install DodoPayments SDK: `cd apps/web && pnpm add dodopayments` (verify exact package name)
- [X] T004 [P] Install Playwright browsers if not done: `npx playwright install chromium`
- [ ] T005 [P] Install k6 for performance testing (see quickstart.md for platform-specific instructions)
- [X] T006 Create environment variable templates: Update `apps/web/.env.local.example` and `apps/worker/.dev.vars.example` with all new variables per quickstart.md
- [X] T007 [P] Generate SESSION_SECRET: Run `openssl rand -base64 32` and add to .env files
- [ ] T008 [P] Create Sentry projects: Create separate projects for "speedstein-web" and "speedstein-worker" in Sentry dashboard, copy DSNs
- [ ] T009 [P] Create DodoPayments test account: Sign up at dodopayments.com, get test API keys, create 4 products (Free/Starter/Pro/Enterprise)
- [ ] T010 Run database migrations: `cd supabase && supabase db push` to create new tables (error_logs, test_results, extend users)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema Extensions

- [X] T011 Create migration file `supabase/migrations/20251027000005_add_error_logs.sql` per data-model.md schema
- [X] T012 [P] Create migration file `supabase/migrations/20251027000006_add_test_results.sql` per data-model.md schema
- [X] T013 Extend users table: Add `subscription_tier` and `account_status` columns per data-model.md (migration 20251027000004_extend_users.sql)
- [ ] T014 Apply all migrations to local database: `supabase db push` and verify with `psql` that all tables exist
- [ ] T015 [P] Apply migrations to production Supabase: `supabase link --project-ref czvvgfprjlkahobgncxo && supabase db push`

### Shared Types & Validation

- [X] T016 [P] Create subscription types in `packages/shared/src/types/subscription.ts` with PlanId and SubscriptionStatus enums
- [X] T017 [P] Create Zod validation schemas in `packages/shared/src/lib/validation.ts`: SignupSchema, LoginSchema, ApiKeyCreateSchema, PaymentWebhookSchema
- [X] T018 [P] Create subscription business logic in `packages/shared/src/lib/subscriptions.ts`: quota limits, tier validation, upgrade/downgrade logic
- [X] T019 [P] Create OKLCH color utilities in `packages/shared/src/utils/oklch.ts`: contrastRatio(), meetsWCAGAAA(), generateGrayScale() per research.md

### Supabase Client Setup

- [X] T020 Create Supabase browser client in `apps/web/src/lib/supabase/client.ts` using @supabase/ssr per research.md pattern
- [X] T021 Create Supabase server client in `apps/web/src/lib/supabase/server.ts` using @supabase/ssr with cookies() integration
- [X] T022 Create Next.js middleware in `apps/web/src/middleware.ts` for session refresh and route protection (protects /dashboard/* routes)

### Sentry Configuration

- [X] T023 Configure Sentry in Next.js: Run `npx @sentry/wizard@latest -i nextjs` in apps/web/, creates sentry.client.config.ts and sentry.server.config.ts
- [X] T024 Create Sentry monitoring service in `apps/worker/src/lib/monitoring.ts`: initSentry(), captureError(), trackPerformanceMetrics() per research.md
- [X] T025 [P] Create structured logging utility in `apps/worker/src/lib/logging.ts`: logInfo(), logWarn(), logError() with JSON format per FR-030

### Authentication Context

- [X] T026 Create auth hook in `apps/web/src/hooks/use-auth.ts`: useAuth() returns { user, session, signOut, refresh }
- [X] T027 [P] Create subscription hook in `apps/web/src/hooks/use-subscription.ts`: useSubscription() returns { subscription, tier, quota, usage }

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Registration and Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to sign up, verify email, log in, and access a basic dashboard showing their subscription tier and usage stats.

**Independent Test**: Create account at /signup, verify email via Supabase dashboard, login at /login, access /dashboard and see Free tier with 0 usage.

### E2E Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T028 [P] [US1] Create E2E test suite in `tests/e2e/auth.spec.ts`: 5 tests for signup, email verification, login, dashboard access, route protection per research.md Playwright patterns
- [ ] T029 [P] [US1] Create integration test in `tests/integration/auth-api.test.ts`: Test Supabase Auth API integration (signup, login, session management)

### Implementation for User Story 1

#### Authentication Pages

- [X] T030 [P] [US1] Create signup page in `apps/web/src/app/(auth)/signup/page.tsx` with email/password form, validation, and "Check your email" confirmation
- [X] T031 [P] [US1] Create login page in `apps/web/src/app/(auth)/login/page.tsx` with email/password form, "Forgot Password" link, and error handling
- [X] T032 [P] [US1] Create verify-email page in `apps/web/src/app/(auth)/verify-email/page.tsx` that handles token from URL and redirects to /dashboard
- [X] T033 [P] [US1] Create reset-password page in `apps/web/src/app/(auth)/reset-password/page.tsx` with password reset flow

#### Authentication Components

- [X] T034 [P] [US1] Create signup form component in `apps/web/src/components/auth/signup-form.tsx` using shadcn/ui Input, Button, Label with client-side validation
- [X] T035 [P] [US1] Create login form component in `apps/web/src/components/auth/login-form.tsx` using shadcn/ui components with error display
- [X] T036 [P] [US1] Create auth guard component in `apps/web/src/components/auth/auth-guard.tsx` for protecting routes (redirect to /login if not authenticated)

#### Dashboard Layout

- [X] T037 [US1] Create dashboard layout in `apps/web/src/app/(dashboard)/layout.tsx` with header, sidebar navigation, and main content area
- [X] T038 [P] [US1] Create dashboard header component in `apps/web/src/components/dashboard/dashboard-header.tsx` with user email, theme toggle, logout button
- [X] T039 [P] [US1] Create dashboard sidebar component in `apps/web/src/components/dashboard/dashboard-sidebar.tsx` with navigation links (Overview, API Keys, Billing, Settings)

#### Dashboard Overview Page

- [X] T040 [US1] Create dashboard overview page in `apps/web/src/app/(dashboard)/page.tsx` showing subscription tier, usage stats, quota limits
- [X] T041 [P] [US1] Create stats card component in `apps/web/src/components/dashboard/stats-card.tsx` for displaying metrics (requests, quota, tier)
- [X] T042 [US1] Fetch user subscription data in dashboard page: Query Supabase for current subscription tier and usage_records for current month
- [X] T043 [US1] Display quota calculation in dashboard: Show "X / Y PDFs used this month" with progress bar using shadcn/ui Progress component

#### Integration & Polish

- [ ] T044 [US1] Add rate limiting to auth endpoints: Extend `apps/worker/src/middleware/rate-limit.ts` to cover /api/auth/* endpoints (5 req/hour for signup, 10 req/15min for login)
- [ ] T045 [US1] Add Sentry error tracking to auth flows: Wrap auth actions in try-catch, call captureError() from monitoring service
- [X] T046 [US1] Implement "Forgot Password" flow: Use Supabase Auth password reset API, send reset email, handle token in reset-password page
- [X] T047 [US1] Add form validation error messages: Use Zod schemas from validation.ts, display field-level errors in forms
- [ ] T048 [US1] Test full auth flow manually: Follow quickstart.md manual test steps for User Story 1

**Checkpoint**: At this point, User Story 1 should be fully functional - users can sign up, log in, and see dashboard

---

## Phase 4: User Story 2 - API Key Management (Priority: P1)

**Goal**: Allow authenticated users to generate, view, copy, and revoke API keys for programmatic PDF generation.

**Independent Test**: Login to /dashboard, navigate to /dashboard/api-keys, create key named "Test Key", copy it, test against API endpoint with curl, revoke key, verify 401 error.

### E2E Tests for User Story 2

- [ ] T049 [P] [US2] Create E2E test suite in `tests/e2e/api-keys.spec.ts`: 4 tests for key creation, listing, revocation, and API usage per spec acceptance scenarios
- [ ] T050 [P] [US2] Create integration test in `tests/integration/api-key-validation.test.ts`: Test API key hashing, validation, and last_used_at update logic

### Implementation for User Story 2

#### API Key Page & Components

- [X] T051 [US2] Create API keys page in `apps/web/src/app/(dashboard)/api-keys/page.tsx` with list of keys and "Generate New Key" button
- [X] T052 [P] [US2] Create API key list component in `apps/web/src/components/dashboard/api-key-list.tsx`: Display table with name, prefix, created_at, last_used_at, is_active, actions (revoke)
- [X] T053 [P] [US2] Create API key create dialog in `apps/web/src/components/dashboard/api-key-create.tsx`: Modal with name input, generates key, shows full key once with copy button

#### API Key Generation Logic

- [X] T054 [US2] Implement API key generation service: Create `generateApiKey()` function that generates `sk_[tier]_[32-char-base62]` format per FR-011
- [X] T055 [US2] Hash API key before storage: Use `crypto.subtle.digest('SHA-256', ...)` to hash key, store hash + prefix (first 8 chars) in database per FR-012
- [X] T056 [US2] Create API endpoint in `apps/web/src/app/api/api-keys/route.ts`: POST to create key, GET to list keys (with RLS), PATCH to revoke key

#### API Key Validation (Worker)

- [X] T057 [US2] Extend auth service in `apps/worker/src/services/auth.service.ts`: Add `validateApiKey()` function to hash incoming key and compare with database
- [X] T058 [US2] Update last_used_at timestamp: After successful validation, update api_keys.last_used_at to NOW() per FR-014
- [X] T059 [US2] Enforce 10 key limit: In key creation endpoint, check count of active keys for user, reject if >= 10 per FR-015
- [ ] T060 [US2] Add API key caching: Implement Cloudflare KV cache in auth.service.ts to reduce database hits (cache hash for 5 minutes) - OPTIONAL OPTIMIZATION, SKIPPED

#### Integration & Testing

- [X] T061 [US2] Update RLS policies: Ensure api_keys table policies allow users to CRUD only their own keys (verified in migration 20250101000002_rls_policies.sql)
- [X] T062 [US2] Add Sentry tracking for key operations: Log key creation, revocation, and validation failures (added to apps/web/src/app/api/api-keys/route.ts)
- [ ] T063 [US2] Test API key flow manually: Follow quickstart.md manual test steps for User Story 2 (create, copy, test with curl, revoke)

**Checkpoint**: At this point, User Stories 1 AND 2 work - users can authenticate AND manage API keys

---

## Phase 5: User Story 3 - Subscription Selection and Payment (Priority: P1)

**Goal**: Enable users to view pricing tiers, upgrade to paid plans via DodoPayments checkout, and have subscription status sync via webhooks.

**Independent Test**: Login as free user, go to /dashboard/billing, click "Upgrade to Starter", complete DodoPayments sandbox checkout, verify tier updates to "starter" and quota increases.

### Integration Tests for User Story 3

- [ ] T064 [P] [US3] Create integration test in `tests/integration/webhooks.test.ts`: Test DodoPayments webhook signature verification, idempotency, and subscription updates per research.md patterns
- [ ] T065 [P] [US3] Create E2E test suite in `tests/e2e/payment.spec.ts`: 5 tests for billing page, checkout flow, subscription display, webhook handling (using sandbox)

### Implementation for User Story 3

#### Billing Page & Components

- [ ] T066 [US3] Create billing page in `apps/web/src/app/(dashboard)/billing/page.tsx` showing current subscription, next billing date, payment method, and pricing tiers
- [ ] T067 [P] [US3] Create subscription card component in `apps/web/src/components/dashboard/subscription-card.tsx`: Display current tier, billing period, "Manage Subscription" button
- [ ] T068 [P] [US3] Create pricing tiers component in `apps/web/src/components/dashboard/pricing-tiers.tsx`: Show Free/Starter/Pro/Enterprise with features and "Upgrade" buttons per FR-018

#### Checkout Flow

- [ ] T069 [US3] Create checkout page in `apps/web/src/app/checkout/page.tsx`: Takes tier as query param, initiates DodoPayments hosted checkout session
- [ ] T070 [US3] Create DodoPayments client in `apps/web/src/lib/dodo/client.ts`: createCheckoutSession() function that calls DodoPayments API to create session
- [ ] T071 [US3] Handle checkout success callback: Create route in `apps/web/src/app/api/checkout/success/route.ts` that displays success message and waits for webhook

#### Webhook Handler (Worker)

- [ ] T072 [US3] Create webhook handler in `apps/worker/src/webhooks/dodo.ts`: Verify signature, check idempotency, handle subscription.created/updated/cancelled/payment.succeeded/payment.failed events per research.md
- [ ] T073 [US3] Implement webhook signature verification: Use HMAC-SHA256 with DODO_WEBHOOK_SECRET to verify X-Dodo-Signature header per research.md, reject if invalid or timestamp >5min old
- [ ] T074 [US3] Implement idempotency check: Query payment_events table for idempotency_key (DodoPayments event ID), return 200 if already processed
- [ ] T075 [US3] Handle subscription.created event: Insert new row in subscriptions table with status="active", update users.subscription_tier, log to payment_events
- [ ] T076 [US3] Handle payment.failed event: Update subscription status to "past_due", update users.account_status to "suspended" if past_due >3 days, send notification
- [ ] T077 [US3] Handle subscription.cancelled event: Set cancel_at_period_end=TRUE, schedule downgrade to free tier at current_period_end date

#### Payment Service

- [ ] T078 [US3] Create payment service in `apps/worker/src/services/payment.service.ts`: Functions for updateSubscription(), cancelSubscription(), checkQuota() using Supabase client
- [ ] T079 [US3] Implement subscription management API: Create endpoint in worker index.ts for POST /api/billing/cancel to trigger cancellation via DodoPayments API

#### Integration & Testing

- [ ] T080 [US3] Add webhook endpoint to wrangler.toml routes: Route `/api/webhooks/dodo` to webhook handler
- [ ] T081 [US3] Configure DodoPayments webhook URL: In DodoPayments dashboard, set webhook URL to `https://your-worker.workers.dev/api/webhooks/dodo`
- [ ] T082 [US3] Add rate limiting to webhook endpoint: Allow 1000 req/min globally (prevent abuse) using existing rate-limit.ts
- [ ] T083 [US3] Add Sentry tracking for payment events: Log all webhook events, track payment failures with user context
- [ ] T084 [US3] Test payment flow manually: Follow quickstart.md manual test steps for User Story 3 (upgrade, verify webhook, check database)
- [ ] T085 [US3] Enforce quota limits based on tier: Update `apps/worker/src/services/quota.service.ts` to check users.subscription_tier and block requests if quota exceeded per FR-026

**Checkpoint**: At this point, User Stories 1, 2, AND 3 work - users can authenticate, manage keys, AND subscribe to paid plans

---

## Phase 6: User Story 4 - Error Tracking and Monitoring (Priority: P1)

**Goal**: Capture all production errors with full context in Sentry, log structured data to database, and alert team on critical issues.

**Independent Test**: Trigger intentional error (POST invalid HTML to /api/generate), verify error appears in Sentry with user_id and api_key_id, check error_logs table has entry.

### Unit Tests for User Story 4

- [ ] T086 [P] [US4] Create unit test in `tests/unit/monitoring.test.ts`: Test initSentry(), captureError(), sanitizeContext() functions

### Implementation for User Story 4

#### Sentry Integration (Frontend)

- [ ] T087 [US4] Verify Sentry Next.js config: Check `apps/web/sentry.client.config.ts` and `sentry.server.config.ts` have correct DSN, environment, beforeSend sanitization per research.md
- [ ] T088 [US4] Add Sentry error boundary: Wrap dashboard layout in ErrorBoundary component that captures React errors and displays fallback UI
- [ ] T089 [US4] Test frontend error capture: Trigger error in dashboard (e.g., throw Error in component), verify appears in Sentry with session context

#### Sentry Integration (Worker)

- [ ] T090 [US4] Initialize Sentry in worker: Call initSentry() from monitoring.ts in `apps/worker/src/index.ts` fetch handler before processing requests
- [ ] T091 [US4] Wrap request handler in try-catch: Capture all unhandled errors, call captureError() with context (url, method, user_id, api_key_id) per FR-029
- [ ] T092 [US4] Sanitize sensitive data before logging: In beforeSend hook, remove Authorization headers, mask API keys (show prefix only), hash email addresses per FR-033

#### Structured Logging

- [ ] T093 [P] [US4] Implement structured logging functions in `apps/worker/src/lib/logging.ts`: logInfo(), logWarn(), logError() output JSON with { level, timestamp, context, message } per FR-030
- [ ] T094 [US4] Add logging to critical operations: Log PDF generation start/end, API key validation, subscription updates, webhook processing with request_id for tracing

#### Error Logs Database

- [ ] T095 [US4] Create monitoring service in `apps/worker/src/services/monitoring.service.ts`: saveErrorLog() inserts to error_logs table with sentry_event_id for cross-reference
- [ ] T096 [US4] Hook error logging to Sentry capture: After captureError(), call saveErrorLog() to persist to database with context

#### Alerting

- [ ] T097 [US4] Configure Sentry alerts: In Sentry dashboard, create alerts for: error rate >10/min, P95 latency >3s, payment webhook failures per FR-032
- [ ] T098 [US4] Test alert triggers: Trigger errors to exceed threshold, verify alerts sent via configured channel (email/Slack)

#### Custom Metrics

- [ ] T099 [P] [US4] Track custom metrics in Sentry: Use Sentry.setMeasurement() to track pdf_generation_time, browser_pool_utilization, quota_enforcement_hits per FR-034
- [ ] T100 [US4] Add performance tracking: In worker handler, measure request duration, call trackPerformanceMetrics() from monitoring.ts to log metrics

#### Integration & Testing

- [ ] T101 [US4] Test error capture manually: Follow quickstart.md manual test steps for User Story 4 (trigger error, check Sentry, check database)
- [ ] T102 [US4] Verify error context completeness: Check Sentry event has all required context per FR-029 (user_id, request_id, environment, timestamp, stack trace)

**Checkpoint**: At this point, all P1 (BLOCKING) user stories are complete - ready for launch with auth, payments, and monitoring

---

## Phase 7: User Story 5 - End-to-End User Flow Testing (Priority: P2)

**Goal**: Automate critical user journeys with Playwright E2E tests, achieving 95% pass rate and capturing artifacts on failure.

**Independent Test**: Run `pnpm test:e2e` and verify all tests pass, artifacts saved to test-results/ directory.

### Implementation for User Story 5

#### E2E Test Suites

- [ ] T103 [P] [US5] Expand auth E2E tests in `tests/e2e/auth.spec.ts`: Add tests for password reset, invalid credentials, session expiration (total 5 tests per FR-035)
- [ ] T104 [P] [US5] Create PDF generation E2E tests in `tests/e2e/pdf-generation.spec.ts`: 6 tests for authenticated request, buffer response, error handling, quota enforcement
- [ ] T105 [P] [US5] Create docs E2E tests in `tests/e2e/docs.spec.ts`: 3 tests for navigation, search, code copy functionality

#### Integration Tests

- [ ] T106 [P] [US5] Expand webhook integration tests in `tests/integration/webhooks.test.ts`: Test all 5 event types (subscription.created/updated/cancelled, payment.succeeded/failed) with idempotency
- [ ] T107 [P] [US5] Create API integration tests in `tests/integration/auth-api.test.ts`: Test Supabase RLS policies, session management, route protection

#### Unit Tests

- [ ] T108 [P] [US5] Create quota unit tests in `tests/unit/quota.test.ts`: Test quota calculation, tier limits, usage tracking per FR-039
- [ ] T109 [P] [US5] Create API key validation tests in `tests/unit/api-key-validation.test.ts`: Test SHA-256 hashing, format validation, prefix extraction
- [ ] T110 [P] [US5] Create subscription logic tests in `tests/unit/subscriptions.test.ts`: Test tier calculations, upgrade/downgrade logic, quota enforcement

#### Test Infrastructure

- [ ] T111 [US5] Configure Playwright test fixtures: Create reusable fixtures for authenticated user, test database, DodoPayments sandbox per research.md patterns
- [ ] T112 [US5] Set up test data cleanup: After each test, delete test users, API keys, subscriptions created during test using Supabase Admin API
- [ ] T113 [US5] Configure artifact capture: In `playwright.config.ts`, enable screenshot, video, trace on failure per FR-037

#### CI/CD Integration

- [ ] T114 [US5] Add test scripts to package.json: `pnpm test:e2e`, `pnpm test:integration`, `pnpm test:unit`, `pnpm test:coverage` per quickstart.md
- [ ] T115 [US5] Set up GitHub Actions workflow: Create `.github/workflows/test.yml` that runs all tests on PR, blocks merge if critical tests fail per FR-040
- [ ] T116 [US5] Configure code coverage reporting: Use Vitest coverage plugin, enforce 80% coverage for services/models, fail build if below 60% per FR-039

#### Security Audit

- [ ] T117 [US5] Run security audit: Execute `npm audit`, `pnpm audit`, fix critical vulnerabilities, document acceptable risks per FR-042
- [ ] T118 [US5] Run Snyk scan: `npx snyk test` to check dependencies for known vulnerabilities, add Snyk to CI/CD

**Checkpoint**: At this point, comprehensive testing infrastructure is in place - all critical flows are automated

---

## Phase 8: User Story 6 - API Documentation Discovery (Priority: P2)

**Goal**: Create searchable, multi-language API documentation at /docs with working code examples for JavaScript, Python, PHP, and Ruby.

**Independent Test**: Visit /docs, search for "generate PDF", view examples in 4 languages, copy JavaScript example, run it successfully.

### Implementation for User Story 6

#### Documentation Pages

- [ ] T119 [US6] Create docs landing page in `apps/web/src/app/docs/page.tsx`: Navigation to Getting Started, API Reference, Auth Guide, Error Codes, Troubleshooting per FR-043
- [ ] T120 [US6] Create dynamic doc page in `apps/web/src/app/docs/[...slug]/page.tsx`: Renders markdown content from `apps/web/src/content/docs/` directory
- [ ] T121 [P] [US6] Create design system docs page in `apps/web/src/app/docs/design-system/page.tsx`: Show OKLCH color palette, elevation levels, component usage

#### Documentation Components

- [ ] T122 [P] [US6] Create doc navigation component in `apps/web/src/components/docs/doc-nav.tsx`: Sidebar with tree structure, collapsible sections, active state
- [ ] T123 [P] [US6] Create code block component in `apps/web/src/components/docs/code-block.tsx`: Syntax-highlighted code using Prism/Shiki, copy button, language label
- [ ] T124 [P] [US6] Create code tabs component in `apps/web/src/components/docs/code-tabs.tsx`: Tab group for JavaScript/Python/PHP/Ruby examples per FR-045
- [ ] T125 [P] [US6] Create search bar component in `apps/web/src/components/docs/search-bar.tsx`: Client-side search using Fuse.js, highlight matches per FR-046

#### Documentation Content

- [ ] T126 [P] [US6] Create Getting Started guide in `apps/web/src/content/docs/getting-started.md`: Signup, API key creation, first PDF generation
- [ ] T127 [P] [US6] Create API Reference in `apps/web/src/content/docs/api-reference.md`: Document POST /api/generate endpoint with parameters, response, examples per FR-044
- [ ] T128 [P] [US6] Create Authentication Guide in `apps/web/src/content/docs/authentication.md`: API key format, header usage, error handling
- [ ] T129 [P] [US6] Create Error Codes guide in `apps/web/src/content/docs/error-codes.md`: List all error codes from contracts/README.md with causes and solutions
- [ ] T130 [P] [US6] Create Troubleshooting guide in `apps/web/src/content/docs/troubleshooting.md`: Common errors (quota exceeded, invalid HTML, timeout) with fixes per FR-047

#### Code Examples

- [ ] T131 [P] [US6] Write JavaScript code examples: For each endpoint, write working example using fetch() with error handling
- [ ] T132 [P] [US6] Write Python code examples: For each endpoint, write working example using requests library
- [ ] T133 [P] [US6] Write PHP code examples: For each endpoint, write working example using cURL or Guzzle
- [ ] T134 [P] [US6] Write Ruby code examples: For each endpoint, write working example using net/http or HTTParty

#### Validation

- [ ] T135 [US6] Create automated example validator: Script that runs each code example against test API, verifies success, fails build if any example broken per edge case
- [ ] T136 [US6] Add documentation to CI/CD: Run example validator in GitHub Actions, block merge if examples are outdated

#### Polish

- [ ] T137 [P] [US6] Update README.md: Add sections for authentication setup, environment variables, DodoPayments config, Sentry setup per FR-045 and quickstart.md
- [ ] T138 [US6] Add copy-to-clipboard functionality: Implement clipboard API in code-block component, show "Copied!" toast on success
- [ ] T139 [US6] Test documentation manually: Follow quickstart.md manual test steps for User Story 6 (navigate, search, copy example, run example)

**Checkpoint**: At this point, comprehensive documentation is available - developers can self-serve without support tickets

---

## Phase 9: User Story 7 - Design System Consistency (Priority: P3)

**Goal**: Complete OKLCH color system with full gray scale, elevation system, WCAG AAA validation, and polished dark mode.

**Independent Test**: Run automated contrast checker, verify all elements meet WCAG AAA, toggle dark mode, verify smooth transitions.

### Implementation for User Story 7

#### OKLCH Color System

- [ ] T140 [US7] Complete OKLCH gray scale in `apps/web/tailwind.config.ts`: Use generateGrayScale() from shared/utils/oklch.ts to generate 50-950 scale per FR-049
- [ ] T141 [US7] Update all color tokens in tailwind.config.ts: Ensure primary, secondary, accent, background, foreground all use OKLCH format per research.md
- [ ] T142 [US7] Remove any RGB/HSL/hex colors: Search codebase for `#`, `rgb(`, `hsl(` and convert to OKLCH or use existing tokens

#### Elevation System

- [ ] T143 [US7] Implement elevation system in `apps/web/src/app/globals.css`: Define CSS custom properties for 4 elevation levels (0-3) using OKLCH lightness manipulation per FR-050
- [ ] T144 [US7] Apply elevation to components: Update Card, Modal, Dropdown components to use elevation classes instead of box-shadow

#### WCAG AAA Validation

- [ ] T145 [US7] Create contrast validation test in `tests/unit/contrast-validation.test.ts`: For each color combination, verify contrastRatio() >= 7.0 for normal text, >= 4.5 for large text per FR-051
- [ ] T146 [US7] Run Lighthouse audit on all pages: Use `lighthouse` CLI or Chrome DevTools, verify accessibility score 100 per Principle VII
- [ ] T147 [US7] Fix any contrast violations: If validation fails, adjust OKLCH lightness values to meet WCAG AAA

#### Dark Mode

- [ ] T148 [US7] Implement dark mode transformations in `apps/web/src/app/globals.css`: In `[data-theme="dark"]` selector, invert lightness of all OKLCH colors per FR-052
- [ ] T149 [US7] Integrate theme toggle into all layouts: Add <ThemeToggle /> component to dashboard header, auth pages header, docs header
- [ ] T150 [US7] Test dark mode transitions: Toggle theme, verify all colors transform smoothly, check for any white flashes or incorrect colors

#### Design System Documentation

- [ ] T151 [US7] Document color system in design-system docs page: Show all OKLCH tokens with lightness/chroma/hue values, usage examples per FR-053
- [ ] T152 [US7] Document elevation system: Show 4 elevation levels with visual examples (Card at level 1, Modal at level 3, etc.)
- [ ] T153 [US7] Document responsive breakpoints: Show 640px/768px/1024px/1280px breakpoints with example usage per Principle VII

#### Validation & Polish

- [ ] T154 [US7] Run automated contrast checker: Execute contrast-validation tests, verify 100% pass rate per SC-007
- [ ] T155 [US7] Visual QA review: Review all pages in light and dark mode, check for any design inconsistencies, fix as needed

**Checkpoint**: At this point, design system is production-ready with full OKLCH implementation and WCAG AAA compliance

---

## Phase 10: User Story 8 - Performance Target Achievement (Priority: P3)

**Goal**: Measure and optimize performance to achieve P50 <1.5s, P95 <2.0s, P99 <3.0s, 100 PDFs/min throughput, 80%+ browser reuse.

**Independent Test**: Run `k6 run tests/performance/load-test.k6.js`, verify all thresholds pass, document baseline in tests/performance/baseline.json.

### Implementation for User Story 8

#### Performance Test Infrastructure

- [ ] T156 [US8] Create k6 load test script in `tests/performance/load-test.k6.js`: 100 concurrent users, 5-minute sustained load, measure P50/P95/P99 latency per research.md
- [ ] T157 [US8] Create performance baseline in `tests/performance/baseline.json`: Document current P50/P95/P99, throughput, error rate, browser reuse rate per data-model.md
- [ ] T158 [US8] Add custom k6 metrics: Track pdf_generation_time, browser_reuse_rate, cloudflare_cache_status from response headers

#### Performance Monitoring

- [ ] T159 [US8] Implement performance tracking in worker: In `apps/worker/src/lib/performance-tracking.ts`, measure request duration, log to Sentry as custom measurement per research.md
- [ ] T160 [US8] Add performance logging: Log slow requests (>2s) with context (cf-ray, cache status, user_id) for debugging

#### Optimization Tasks

- [ ] T161 [US8] Optimize browser session management: In `apps/worker/src/durable-objects/BrowserPoolDO.ts`, implement 5-minute session recycling and 1-minute idle cleanup per FR-055
- [ ] T162 [US8] Implement PDF caching: Create `pdf_cache` table per data-model.md, store html_hash -> pdf_url with 1-hour expiration per FR-057
- [ ] T163 [US8] Configure R2 CDN caching: Add Cache-Control headers to R2 URLs with 24-hour lifetime per FR-056
- [ ] T164 [US8] Profile API key caching: Verify Cloudflare KV cache hit rate for API key validation, tune TTL if needed

#### Load Testing

- [ ] T165 [US8] Run baseline load test: Execute k6 script against local dev server, document results in baseline.json
- [ ] T166 [US8] Deploy to production: Deploy worker to Cloudflare (no wrangler remote overhead), run load test again
- [ ] T167 [US8] Compare production vs dev performance: Verify 30-40% latency improvement in production per research.md expectations

#### Performance Validation

- [ ] T168 [US8] Validate P50/P95/P99 targets: Check k6 output, verify P50 <1.5s, P95 <2.0s, P99 <3.0s per SC-008
- [ ] T169 [US8] Validate throughput target: Check k6 output, verify sustained 100+ PDFs/minute per FR-058
- [ ] T170 [US8] Validate browser reuse rate: Check BrowserPoolDO metrics, verify >80% reuse rate per SC-008
- [ ] T171 [US8] Set up performance regression alerts: In Sentry, create alert if P95 >2.5s, notify team per research.md

**Checkpoint**: At this point, performance targets are met and monitored - ready for high-scale production launch

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [ ] T172 [P] Run TypeScript type checking: `pnpm tsc --noEmit` in all apps and packages, fix any type errors
- [ ] T173 [P] Run linter: `pnpm lint` and fix any violations
- [ ] T174 [P] Run code formatter: `pnpm format` to ensure consistent code style
- [ ] T175 [P] Update CLAUDE.md: Document any new patterns, libraries, or conventions discovered during implementation
- [ ] T176 Verify all environment variables documented: Check `.env.local.example` and `.dev.vars.example` have all required variables from quickstart.md
- [ ] T177 [P] Run quickstart.md validation: Follow all manual test steps in quickstart.md, verify every step works
- [ ] T178 Create deployment checklist: Document pre-launch checklist (database migrations, environment variables, Sentry projects, DodoPayments webhooks)
- [ ] T179 [P] Security hardening review: Check for hardcoded secrets, verify RLS policies, test rate limiting, validate CORS config
- [ ] T180 Final E2E test run: Execute `pnpm test:e2e` on all test suites, verify 95%+ pass rate per SC-005
- [ ] T181 Load test against production: Run k6 load test against production worker, verify performance targets met
- [ ] T182 Lighthouse audit all pages: Run Lighthouse on /, /signup, /login, /dashboard, /docs - verify 95+ scores per Principle VII
- [ ] T183 Review Sentry dashboard: Check error rate, verify alerts configured, test alert notifications
- [ ] T184 Final constitution compliance check: Review all 10 principles in constitution.md, verify compliance, document any deviations
- [ ] T185 Create launch announcement: Draft announcement for Product Hunt, social media, blog post

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-10)**: All depend on Foundational phase completion
  - **P1 stories (US1-US4)**: BLOCKING for launch - must complete in order (US1 → US2 → US3 → US4) due to dependencies
  - **P2 stories (US5-US6)**: HIGH RISK - can start after P1, run in parallel with each other
  - **P3 stories (US7-US8)**: POLISH - can start after P1, run in parallel with each other
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

**Sequential Dependencies (MUST follow order)**:
- **User Story 1 (Auth)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (API Keys)**: Depends on US1 completion - requires authenticated users and dashboard
- **User Story 3 (Payments)**: Depends on US1 completion - requires authenticated users and dashboard
- **User Story 4 (Monitoring)**: Can run parallel with US2/US3 - Independent of auth flows

**Parallel Opportunities (can run simultaneously)**:
- After US1 complete: US2, US3, US4 can run in parallel (different developers)
- After US1 complete: US5, US6 can run in parallel
- After US1 complete: US7, US8 can run in parallel

### Within Each User Story

- E2E/Integration/Unit tests MUST be written and FAIL before implementation
- Components/pages marked [P] can run in parallel (different files)
- Services depend on database migrations being complete
- Integration tasks depend on all components being implemented

### Parallel Opportunities by Phase

**Phase 1 (Setup)**: Tasks T001-T010 mostly [P] - install dependencies in parallel
**Phase 2 (Foundational)**: Tasks T016-T027 mostly [P] - create shared code in parallel
**Phase 3 (US1)**: T030-T033 [P] (auth pages), T034-T036 [P] (auth components), T038-T039 [P] (dashboard components)
**Phase 4 (US2)**: T052-T053 [P] (API key components)
**Phase 5 (US3)**: T067-T068 [P] (billing components)
**Phase 6 (US4)**: T093 [P] (logging utils), T099 [P] (custom metrics)
**Phase 7 (US5)**: T103-T105 [P] (E2E suites), T106-T107 [P] (integration tests), T108-T110 [P] (unit tests)
**Phase 8 (US6)**: T121-T125 [P] (doc components), T126-T130 [P] (doc content), T131-T134 [P] (code examples)
**Phase 11 (Polish)**: T172-T179 [P] (most polish tasks)

---

## Parallel Example: Complete Workflow

### Minimal MVP (Solo Developer)

1. **Week 1**: Complete Phase 1 + Phase 2 → Foundation ready
2. **Week 2**: Complete Phase 3 (US1 Auth) → Users can sign up and login
3. **Week 3**: Complete Phase 4 (US2 API Keys) → Users can generate keys and use API
4. **Week 4**: Complete Phase 5 (US3 Payments) → Revenue generation enabled
5. **Week 5**: Complete Phase 6 (US4 Monitoring) → Production-ready with observability
6. **Deploy MVP**: Auth + API Keys + Payments + Monitoring (skip US5-US8 initially)

### Full Team (3 Developers in Parallel)

1. **All Together**: Complete Phase 1 + Phase 2 (2-3 days) → Foundation ready
2. **In Parallel** (Week 1):
   - Dev A: Phase 3 (US1 Auth)
   - Dev B: Phase 6 (US4 Monitoring setup)
   - Dev C: Phase 8 (US6 Documentation)
3. **In Parallel** (Week 2):
   - Dev A: Phase 4 (US2 API Keys) - depends on US1
   - Dev B: Phase 7 (US5 E2E Tests) - tests US1/US2
   - Dev C: Phase 9 (US7 Design System)
4. **In Parallel** (Week 3):
   - Dev A: Phase 5 (US3 Payments) - depends on US1
   - Dev B: Phase 10 (US8 Performance)
   - Dev C: Phase 11 (Polish)
5. **Deploy**: All stories complete in 3 weeks vs 5 weeks solo

### Critical Path (Fastest to Launch)

**Absolute minimum for launch**:
1. Setup + Foundational (3-4 days)
2. US1 Auth (2-3 days)
3. US2 API Keys (1-2 days)
4. US3 Payments (2-3 days)
5. US4 Monitoring (1 day)
6. Polish (1 day)

**Total: 10-14 days to minimum viable launch**

**Nice-to-have (add 3-5 days)**:
7. US5 E2E Tests (2-3 days)
8. US6 Documentation (1-2 days)

**Polish items (add 2-3 days)**:
9. US7 Design System (1-2 days)
10. US8 Performance (1 day)

---

## Implementation Strategy

### MVP First (P1 Only)

**Goal**: Launch-ready product with auth, API keys, payments, and monitoring

1. Complete Phase 1: Setup (1 day)
2. Complete Phase 2: Foundational (2 days)
3. Complete Phase 3: US1 Auth (3 days)
4. **STOP and VALIDATE**: Test signup, login, dashboard independently
5. Complete Phase 4: US2 API Keys (2 days)
6. **STOP and VALIDATE**: Test key generation, API usage independently
7. Complete Phase 5: US3 Payments (3 days)
8. **STOP and VALIDATE**: Test checkout, webhook, tier upgrade independently
9. Complete Phase 6: US4 Monitoring (1 day)
10. **STOP and VALIDATE**: Trigger error, check Sentry, verify alerting
11. Complete Phase 11: Polish (1 day)
12. **DEPLOY MVP**: 13 days total

### Incremental Delivery (All Stories)

1. **Foundation** (Phase 1-2): 3 days → Environment ready
2. **MVP** (Phase 3-6): 9 days → Launch-ready (auth, keys, payments, monitoring)
3. **Testing** (Phase 7): 3 days → E2E coverage for regression prevention
4. **Documentation** (Phase 8): 2 days → Developer self-service
5. **Polish** (Phase 9-10): 3 days → Design system + performance optimization
6. **Final Polish** (Phase 11): 1 day → Security, linting, launch prep
7. **Total**: 21 days to complete all 8 user stories

---

## Task Summary

**Total Tasks**: 185 tasks across 11 phases
**Parallel Opportunities**: 78 tasks marked [P] (42% can run in parallel)

**Tasks per User Story**:
- US1 (Auth): 21 tasks (T028-T048)
- US2 (API Keys): 15 tasks (T049-T063)
- US3 (Payments): 22 tasks (T064-T085)
- US4 (Monitoring): 17 tasks (T086-T102)
- US5 (E2E Testing): 16 tasks (T103-T118)
- US6 (Documentation): 21 tasks (T119-T139)
- US7 (Design System): 16 tasks (T140-T155)
- US8 (Performance): 16 tasks (T156-T171)

**Priority Distribution**:
- P1 (BLOCKING): 75 tasks (Setup + Foundational + US1-US4)
- P2 (HIGH RISK): 37 tasks (US5-US6)
- P3 (POLISH): 32 tasks (US7-US8)
- Cross-cutting: 14 tasks (Phase 11)

**Independent Test Criteria Met**: Each user story has clear acceptance criteria and can be tested independently per spec.md requirements.

**Suggested MVP Scope**: Phases 1-6 (US1-US4) = 75 tasks = 13 days solo / 7 days with 3 developers

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks can run in parallel (different files, no shared state)
- [Story] label (US1-US8) maps task to user story for traceability
- Each user story phase has clear goal and independent test criteria
- Tests are included per specification requirements (FR-035 through FR-042)
- All file paths are absolute from repository root
- Constitution compliance verified in plan.md (all 10 principles passed)
- Performance targets documented in research.md and tracked in US8
- Security patterns (SHA-256 hashing, RLS, signature verification) per research.md
- Commit frequently - after each task or logical group
- Stop at checkpoints to validate story independence
- Skip P2/P3 stories if time-constrained - MVP is complete with P1 only

