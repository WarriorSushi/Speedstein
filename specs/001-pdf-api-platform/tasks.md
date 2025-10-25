# Tasks: Speedstein PDF API Platform

**Input**: Design documents from `/specs/001-pdf-api-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per constitutional requirement (Principle VIII) - unit tests for business logic, integration tests for API endpoints, E2E tests for user flows, targeting 80%+ code coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `apps/web/` (Next.js frontend), `apps/worker/` (Cloudflare Worker backend)
- **Shared packages**: `packages/shared/` (types), `packages/database/` (migrations)
- Paths use repository root as base

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize pnpm workspace at repository root with pnpm-workspace.yaml
- [X] T002 Create Next.js 15 app with App Router in apps/web using create-next-app@latest --app --typescript
- [X] T003 [P] Initialize Cloudflare Worker project in apps/worker using wrangler init
- [X] T004 [P] Create shared packages: packages/shared (types) and packages/database (migrations)
- [X] T005 [P] Configure TypeScript strict mode in all tsconfig.json files (apps/web, apps/worker, packages/shared)
- [X] T006 [P] Setup ESLint and Prettier with consistent rules across all packages
- [X] T007 [P] Install core dependencies: Tailwind CSS, shadcn/ui, Supabase client, capnweb (Cap'n Web), Zod, DodoPayments SDK
- [X] T008 Create .env.example files in apps/web and apps/worker with all required environment variables
- [X] T009 [P] Setup Vitest for unit tests in apps/worker and packages/shared
- [X] T010 [P] Setup Playwright for E2E tests in tests/e2e directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Create Supabase project and save SUPABASE_URL and SUPABASE_ANON_KEY to environment variables (Project ID: czvvgfprjlkahobgncxo)
- [X] T012 Create database migration 001_initial_schema.sql in packages/database/migrations for users, api_keys, subscriptions, usage_quotas, usage_records, invoices tables
- [X] T013 Create database migration 002_rls_policies.sql in packages/database/migrations with RLS policies for all tables
- [X] T014 Create database migration 003_indexes.sql in packages/database/migrations with performance indexes
- [X] T015 [P] Run database migrations against Supabase project using Supabase CLI (Migrations pushed successfully)
- [X] T016 [P] Generate TypeScript types from database schema in packages/database/types.ts using Supabase CLI (Command available in MANUAL_SETUP_GUIDE.md)
- [X] T017 Create Supabase client utility in packages/shared/src/lib/supabase.ts with proper typing
- [X] T018 Setup Cloudflare account and create R2 bucket for PDF storage (Bucket: speedstein-pdfs-dev, credentials in .dev.vars)
- [X] T019 [P] Setup Cloudflare KV namespace for rate limiting cache (Namespaces: speedstein-rate-limit-dev, speedstein-rate-limit-preview)
- [X] T020 [P] Configure Cloudflare Browser Rendering API binding in wrangler.toml (Workers Paid plan activated, browser binding configured)
- [X] T021 Create shared TypeScript types in packages/shared/src/types/api.ts (PdfOptions, PdfResult, ApiError)
- [X] T022 [P] Create shared Zod schemas in packages/shared/src/lib/validation.ts (GeneratePdfSchema, CreateApiKeySchema)
- [X] T023 [P] Setup Tailwind CSS config in apps/web/tailwind.config.ts with OKLCH color system tokens
- [X] T024 [P] Initialize shadcn/ui and add core components: Button, Card, Input, Label, Select, Dialog, Toast to apps/web/src/components/ui
- [X] T025 Create globals.css in apps/web/src/styles with OKLCH CSS custom properties for light and dark themes
- [X] T026 [P] Configure next-themes provider in apps/web/src/app/providers.tsx for dark mode support
- [ ] T027 Setup Sentry for error tracking in both apps/web and apps/worker with source maps (OPTIONAL - for production monitoring)

**✅ Checkpoint COMPLETE**: Foundation ready - ALL critical infrastructure configured! User story implementation and testing can now proceed.

---

## Phase 3: User Story 1 - REST API PDF Generation (Priority: P1) 🎯 MVP

**Goal**: Enable developers to generate PDFs from HTML via simple REST API with <2s P95 latency

**Independent Test**: Send HTML payload via POST to /api/generate, verify PDF URL returned in <2s with correct rendering

### Unit Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T028 [P] [US1] Write unit test for API key hashing utility in apps/worker/src/lib/__tests__/crypto.test.ts
- [X] T029 [P] [US1] Write unit test for HTML validation with Zod schema in apps/worker/src/lib/__tests__/validation.test.ts
- [X] T030 [P] [US1] Write unit test for quota checking logic in apps/worker/src/services/__tests__/quota.service.test.ts
- [X] T031 [P] [US1] Write unit test for PDF generation options parsing in apps/worker/src/services/__tests__/pdf.service.test.ts

### Implementation for User Story 1

- [X] T032 [P] [US1] Create PdfOptions and PdfResult types in packages/shared/src/types/pdf.ts
- [X] T033 [P] [US1] Create ApiError class in packages/shared/src/lib/errors.ts with error codes (INVALID_HTML, QUOTA_EXCEEDED, GENERATION_TIMEOUT)
- [X] T034 [US1] Implement crypto utility in apps/worker/src/lib/crypto.ts for SHA-256 API key hashing
- [X] T035 [US1] Implement R2 upload utility in apps/worker/src/lib/r2.ts for PDF storage with 30-day TTL
- [X] T036 [US1] Create PdfService in apps/worker/src/services/pdf.service.ts with generatePdf method using Cloudflare Browser Rendering API
- [X] T037 [US1] Implement browser session pooling in apps/worker/src/lib/browser-pool.ts (maintain exactly 8 warm Chrome contexts, FIFO eviction after 5min idle, max pool age 1 hour, dispose on worker shutdown)
- [X] T038 [US1] Create AuthService in apps/worker/src/services/auth.service.ts with validateApiKey method (SHA-256 hash lookup in api_keys table)
- [X] T039 [US1] Create QuotaService in apps/worker/src/services/quota.service.ts with checkQuota and incrementUsage methods
- [X] T040 [US1] Implement rate limiting middleware in apps/worker/src/middleware/rate-limit.ts using Cloudflare KV with sliding window algorithm
- [X] T041 [US1] Implement CORS middleware in apps/worker/src/middleware/cors.ts with proper preflight handling
- [X] T042 [US1] Create PdfGeneratorApi RpcTarget in apps/worker/src/rpc/pdf-generator.ts extending RpcTarget with generatePdf and ping methods
- [X] T043 [US1] Implement REST API endpoint handler in apps/worker/src/index.ts for POST /api/generate with auth, quota check, PDF generation, usage tracking
- [X] T044 [US1] Add structured logging for PDF generation in apps/worker/src/lib/logger.ts (log generation time, HTML size, user ID, API key ID)
- [X] T045 [US1] Implement resource disposal with try-finally blocks in PdfService to ensure browser pages are always closed

### Integration Tests for User Story 1

- [X] T046 [P] [US1] Write integration test for POST /api/generate with valid HTML in tests/integration/api/generate.test.ts
- [X] T047 [P] [US1] Write integration test for POST /api/generate with custom options (A4, landscape, margins) in tests/integration/api/generate-options.test.ts
- [X] T048 [P] [US1] Write integration test for POST /api/generate with invalid HTML (>10MB) expecting 413 error in tests/integration/api/generate-errors.test.ts
- [X] T049 [P] [US1] Write integration test for quota enforcement (generate PDFs until quota exceeded, verify 429 error) in tests/integration/api/quota.test.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - developers can generate PDFs via REST API

---

## Phase 4: User Story 2 - Interactive Landing Page Demo (Priority: P1) 🎯 MVP

**Goal**: Provide live demo with Monaco editor where visitors can edit HTML and generate PDFs instantly without signup

**Independent Test**: Visit landing page, edit HTML in Monaco editor, click "Generate PDF", verify PDF displays in viewer with generation time

### Unit Tests for User Story 2

- [ ] T050 [P] [US2] Write unit test for Monaco editor state management in apps/web/src/components/landing/__tests__/demo-editor.test.tsx
- [ ] T051 [P] [US2] Write unit test for PDF preview component in apps/web/src/components/landing/__tests__/pdf-viewer.test.tsx
- [ ] T052 [P] [US2] Write unit test for generation time formatting utility in apps/web/src/lib/__tests__/format.test.ts

### Implementation for User Story 2

- [ ] T053 [P] [US2] Create layout for (marketing) route group in apps/web/src/app/(marketing)/layout.tsx with navigation and footer
- [ ] T054 [P] [US2] Create Navigation component in apps/web/src/components/shared/navigation.tsx with Logo, Pricing, Docs, Login/Signup links
- [ ] T055 [P] [US2] Create Footer component in apps/web/src/components/shared/footer.tsx with links and social icons
- [ ] T056 [US2] Create Hero section component in apps/web/src/components/landing/hero.tsx with headline "The Fastest PDF API" and value proposition
- [ ] T057 [US2] Implement Monaco code editor component in apps/web/src/components/landing/demo-editor.tsx with HTML syntax highlighting and sample content
- [ ] T058 [US2] Create PDF viewer component in apps/web/src/components/landing/pdf-viewer.tsx using iframe to display generated PDF
- [ ] T059 [US2] Implement demo generation handler in apps/web/src/app/(marketing)/page.tsx that calls public /api/generate-demo endpoint
- [ ] T060 [US2] Create public demo endpoint in apps/worker/src/index.ts at /api/generate-demo with rate limiting by X-Forwarded-For IP address (10 requests per sliding 1-hour window using Cloudflare KV, return 429 with Retry-After header when exceeded)
- [ ] T061 [US2] Add generation time display in apps/web/src/components/landing/generation-stats.tsx showing "Generated in X.XX seconds"
- [ ] T062 [US2] Optimize Monaco editor bundle with dynamic import in apps/web/src/components/landing/demo-editor.tsx to achieve LCP <2s
- [ ] T063 [US2] Add responsive styles for mobile in apps/web/src/components/landing/hero.tsx using Tailwind breakpoints (sm:, md:, lg:)
- [ ] T064 [US2] Implement theme toggle button in apps/web/src/components/shared/theme-toggle.tsx using next-themes
- [ ] T065 [US2] Create Pricing section in apps/web/src/components/landing/pricing.tsx showing all 4 tiers (Free, Starter, Pro, Enterprise)

### E2E Tests for User Story 2

- [ ] T066 [P] [US2] Write E2E test for landing page load time (verify LCP <2s) in tests/e2e/landing.spec.ts
- [ ] T067 [P] [US2] Write E2E test for editing HTML and generating PDF in tests/e2e/demo.spec.ts
- [ ] T068 [P] [US2] Write E2E test for dark mode toggle in tests/e2e/theme.spec.ts
- [ ] T069 [P] [US2] Write E2E test for mobile responsiveness in tests/e2e/responsive.spec.ts

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently - visitors can use live demo without signup

---

## Phase 5: User Story 3 - User Authentication & API Key Management (Priority: P2)

**Goal**: Enable users to signup, login, create/revoke API keys with descriptive names

**Independent Test**: Complete signup flow, create API key named "Production", use key in API request, revoke key and verify 401

### Unit Tests for User Story 3

- [ ] T070 [P] [US3] Write unit test for API key generation (verify format: sk_live_..., SHA-256 hash) in apps/worker/src/services/__tests__/api-key.service.test.ts
- [ ] T071 [P] [US3] Write unit test for API key revocation logic in apps/worker/src/services/__tests__/api-key.service.test.ts
- [ ] T072 [P] [US3] Write unit test for Supabase auth JWT validation in apps/web/src/lib/__tests__/auth.test.ts

### Implementation for User Story 3

- [ ] T073 [P] [US3] Create layout for (auth) route group in apps/web/src/app/(auth)/layout.tsx with centered card design
- [ ] T074 [P] [US3] Create signup page in apps/web/src/app/(auth)/signup/page.tsx with email/password form using Supabase Auth
- [ ] T075 [P] [US3] Create login page in apps/web/src/app/(auth)/login/page.tsx with email/password form and "Forgot password" link
- [ ] T076 [P] [US3] Create layout for (dashboard) route group in apps/web/src/app/(dashboard)/layout.tsx with sidebar navigation
- [ ] T077 [US3] Create API key management page in apps/web/src/app/(dashboard)/api-keys/page.tsx with list of keys and create/revoke actions
- [ ] T078 [US3] Create ApiKeyService in apps/worker/src/services/api-key.service.ts with createApiKey, listApiKeys, revokeApiKey methods
- [ ] T079 [US3] Implement POST /api/keys endpoint in apps/worker/src/index.ts for creating API keys (requires Supabase JWT auth)
- [ ] T080 [US3] Implement GET /api/keys endpoint in apps/worker/src/index.ts for listing user's API keys
- [ ] T081 [US3] Implement DELETE /api/keys/:id endpoint in apps/worker/src/index.ts for revoking API keys
- [ ] T082 [US3] Create API key display component in apps/web/src/components/dashboard/api-key-card.tsx showing name, prefix, last4, revoked status
- [ ] T083 [US3] Add "Copy API key" button with toast notification in apps/web/src/components/dashboard/api-key-card.tsx (key shown only once at creation)
- [ ] T084 [US3] Create middleware for protected dashboard routes in apps/web/src/middleware.ts (redirect to /login if not authenticated)
- [ ] T085 [US3] Initialize default subscription (plan_tier='free', quota=100) and usage_quotas on user signup via database trigger

### Integration Tests for User Story 3

- [ ] T086 [P] [US3] Write integration test for signup flow (create account, verify redirect to dashboard) in tests/integration/auth/signup.test.ts
- [ ] T087 [P] [US3] Write integration test for API key creation (verify SHA-256 hash stored, not plaintext) in tests/integration/api/api-keys.test.ts
- [ ] T088 [P] [US3] Write integration test for API key authentication (generate PDF with created key) in tests/integration/api/auth.test.ts
- [ ] T089 [P] [US3] Write integration test for API key revocation (revoke key, verify 401 on next request) in tests/integration/api/revoke.test.ts

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently - users can signup and manage API keys

---

## Phase 6: User Story 4 - Usage Tracking & Dashboard Analytics (Priority: P2)

**Goal**: Display usage statistics, quota percentage, charts, and breakdown by API key in dashboard

**Independent Test**: Generate PDFs via API, view dashboard, verify usage counts match actual calls

### Unit Tests for User Story 4

- [ ] T090 [P] [US4] Write unit test for usage aggregation query in apps/worker/src/services/__tests__/usage.service.test.ts
- [ ] T091 [P] [US4] Write unit test for quota percentage calculation in apps/web/src/lib/__tests__/quota.test.ts
- [ ] T092 [P] [US4] Write unit test for daily usage chart data transformation in apps/web/src/lib/__tests__/charts.test.ts

### Implementation for User Story 4

- [ ] T093 [P] [US4] Create UsageService in apps/worker/src/services/usage.service.ts with getUsageStats, getUsageByApiKey, getDailyHistory methods
- [ ] T094 [P] [US4] Create usage tracking utility in apps/worker/src/lib/track-usage.ts to insert usage_records and increment usage_quotas.current_usage
- [ ] T095 [US4] Implement GET /api/usage endpoint in apps/worker/src/index.ts returning quota, byApiKey, history, performance metrics
- [ ] T096 [US4] Integrate usage tracking into POST /api/generate handler in apps/worker/src/index.ts (call after successful PDF generation)
- [ ] T097 [US4] Create dashboard home page in apps/web/src/app/(dashboard)/dashboard/page.tsx with quota widget and usage chart
- [ ] T098 [US4] Create quota widget component in apps/web/src/components/dashboard/quota-widget.tsx with progress bar and percentage
- [ ] T099 [US4] Create usage chart component in apps/web/src/components/dashboard/usage-chart.tsx using Recharts for 30-day area chart
- [ ] T100 [US4] Create usage by API key table in apps/web/src/components/dashboard/usage-by-key.tsx showing name, count, avg generation time
- [ ] T101 [US4] Add upgrade prompt component in apps/web/src/components/dashboard/upgrade-prompt.tsx shown when quota >80%
- [ ] T102 [US4] Add "Quota exceeded" banner in apps/web/src/components/dashboard/quota-exceeded.tsx shown when quota >=100%
- [ ] T103 [US4] Implement scheduled job to reset usage quotas monthly in apps/worker/src/cron/reset-quotas.ts (set current_usage=0, shift period)

### Integration Tests for User Story 4

- [ ] T104 [P] [US4] Write integration test for usage tracking (generate PDF, verify usage_records inserted) in tests/integration/api/usage-tracking.test.ts
- [ ] T105 [P] [US4] Write integration test for GET /api/usage (verify quota, byApiKey, history data) in tests/integration/api/usage.test.ts
- [ ] T106 [P] [US4] Write integration test for quota enforcement (exceed quota, verify 429 error) in tests/integration/api/quota-exceeded.test.ts

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently - users can view usage analytics

---

## Phase 7: User Story 5 - Subscription Management & Billing (Priority: P3)

**Goal**: Enable users to upgrade/downgrade subscriptions via DodoPayments with immediate quota updates

**Independent Test**: Upgrade from Free to Starter, complete checkout, verify quota increases to 5K, receive invoice email

### Unit Tests for User Story 5

- [ ] T107 [P] [US5] Write unit test for DodoPayments webhook signature verification in apps/worker/src/lib/__tests__/dodo-webhook.test.ts
- [ ] T108 [P] [US5] Write unit test for prorated charge calculation in apps/worker/src/services/__tests__/billing.service.test.ts
- [ ] T109 [P] [US5] Write unit test for plan quota mapping (free→100, starter→5K, pro→50K) in apps/worker/src/lib/__tests__/plans.test.ts

### Implementation for User Story 5

- [ ] T110 [P] [US5] Create DodoPayments client utility in apps/worker/src/lib/dodo-client.ts with API key from environment
- [ ] T111 [P] [US5] Create BillingService in apps/worker/src/services/billing.service.ts with createCheckoutSession, handleWebhook methods
- [ ] T112 [US5] Implement POST /api/subscriptions/checkout endpoint in apps/worker/src/index.ts creating DodoPayments checkout session
- [ ] T113 [US5] Implement POST /api/subscriptions/webhook endpoint in apps/worker/src/index.ts handling payment.succeeded, payment.failed, subscription.updated events
- [ ] T114 [US5] Implement webhook signature verification in apps/worker/src/middleware/verify-webhook.ts using HMAC SHA-256
- [ ] T115 [US5] Create subscription update logic in apps/worker/src/services/subscription.service.ts to update plan_tier and usage_quotas.plan_quota
- [ ] T116 [US5] Create invoice record insertion in apps/worker/src/services/invoice.service.ts on payment.succeeded event
- [ ] T117 [US5] Create settings page in apps/web/src/app/(dashboard)/settings/page.tsx with current plan display and upgrade/downgrade buttons
- [ ] T118 [US5] Create subscription card component in apps/web/src/components/dashboard/subscription-card.tsx showing plan, price, quota, current period
- [ ] T119 [US5] Implement upgrade flow in apps/web/src/app/(dashboard)/settings/page.tsx redirecting to DodoPayments checkout URL
- [ ] T120 [US5] Implement downgrade/cancel flow in apps/web/src/components/dashboard/cancel-subscription.tsx with confirmation dialog
- [ ] T121 [US5] Setup email notifications using Resend or SendGrid for invoice delivery and payment failures in apps/worker/src/lib/email.ts

### Integration Tests for User Story 5

- [ ] T122 [P] [US5] Write integration test for checkout session creation in tests/integration/api/checkout.test.ts
- [ ] T123 [P] [US5] Write integration test for webhook processing (simulate payment.succeeded event) in tests/integration/webhooks/dodo.test.ts
- [ ] T124 [P] [US5] Write integration test for plan upgrade (verify quota increases immediately) in tests/integration/api/upgrade.test.ts
- [ ] T125 [P] [US5] Write integration test for plan downgrade (verify scheduled for next period) in tests/integration/api/downgrade.test.ts

**Checkpoint**: At this point, User Story 5 should be fully functional and testable independently - users can manage subscriptions

---

## Phase 8: User Story 6 - WebSocket API with Promise Pipelining (Priority: P3)

**Goal**: Provide WebSocket RPC API for high-volume users achieving 100+ PDFs/min with Cap'n Web promise pipelining

**Independent Test**: Establish WebSocket connection to /api/rpc, send 100 batch PDF requests, verify throughput >100 PDFs/min

### Unit Tests for User Story 6

- [ ] T126 [P] [US6] Write unit test for generateBatch method (verify Promise.all parallel processing) in apps/worker/src/rpc/__tests__/pdf-generator.test.ts
- [ ] T127 [P] [US6] Write unit test for WebSocket heartbeat mechanism in apps/worker/src/rpc/__tests__/heartbeat.test.ts
- [ ] T128 [P] [US6] Write unit test for RpcTarget resource disposal in apps/worker/src/rpc/__tests__/disposal.test.ts

### Implementation for User Story 6

- [ ] T129 [P] [US6] Implement generateBatch method in apps/worker/src/rpc/pdf-generator.ts accepting array of PdfJob, returning Promise.all
- [ ] T130 [P] [US6] Implement WebSocket heartbeat in apps/worker/src/rpc/pdf-generator.ts with 30s ping/pong interval
- [ ] T131 [US6] Add WebSocket RPC endpoint handler in apps/worker/src/index.ts at /api/rpc using newWorkersRpcResponse
- [ ] T132 [US6] Implement Symbol.dispose in apps/worker/src/rpc/pdf-generator.ts for browser cleanup on RpcTarget disposal
- [ ] T133 [US6] Add structured logging for WebSocket connections in apps/worker/src/lib/logger.ts (connection opened, batch size, generation time)
- [ ] T134 [US6] Create WebSocket client example in docs/ for JavaScript showing promise pipelining usage
- [ ] T135 [US6] Create WebSocket client example in docs/ for Python showing batch PDF generation

### Integration Tests for User Story 6

- [ ] T136 [P] [US6] Write integration test for WebSocket connection establishment in tests/integration/websocket/connect.test.ts
- [ ] T137 [P] [US6] Write integration test for batch PDF generation (send 100 requests, measure throughput) in tests/integration/websocket/batch.test.ts
- [ ] T138 [P] [US6] Write integration test for promise pipelining (chain dependent calls in one round trip) in tests/integration/websocket/pipelining.test.ts
- [ ] T139 [P] [US6] Write integration test for WebSocket reconnection after disconnect in tests/integration/websocket/reconnect.test.ts

**Checkpoint**: At this point, User Story 6 should be fully functional and testable independently - high-volume users can use WebSocket API

---

## Phase 9: User Story 7 - Developer Documentation & Code Examples (Priority: P3)

**Goal**: Provide comprehensive documentation with quickstart guide and multi-language code examples

**Independent Test**: Follow quickstart guide from scratch using JavaScript example, successfully generate first PDF

### Implementation for User Story 7

- [ ] T140 [P] [US7] Create documentation layout in apps/web/src/app/(marketing)/docs/layout.tsx with sidebar navigation
- [ ] T141 [P] [US7] Create quickstart page in apps/web/src/app/(marketing)/docs/quickstart/page.tsx based on quickstart.md
- [ ] T142 [P] [US7] Create API reference page in apps/web/src/app/(marketing)/docs/api/page.tsx documenting all endpoints
- [ ] T143 [P] [US7] Create JavaScript examples page in apps/web/src/app/(marketing)/docs/examples/javascript/page.tsx with copy-paste code
- [ ] T144 [P] [US7] Create Python examples page in apps/web/src/app/(marketing)/docs/examples/python/page.tsx with copy-paste code
- [ ] T145 [P] [US7] Create PHP examples page in apps/web/src/app/(marketing)/docs/examples/php/page.tsx with copy-paste code
- [ ] T146 [P] [US7] Create Ruby examples page in apps/web/src/app/(marketing)/docs/examples/ruby/page.tsx with copy-paste code
- [ ] T147 [P] [US7] Create WebSocket examples page in apps/web/src/app/(marketing)/docs/advanced/websocket/page.tsx showing Cap'n Web usage
- [ ] T148 [US7] Update root README.md with setup instructions, prerequisites, and links to docs
- [ ] T149 [US7] Add inline JSDoc comments to all public functions in apps/worker/src/services/ and apps/worker/src/rpc/
- [ ] T150 [US7] Create troubleshooting guide in apps/web/src/app/(marketing)/docs/troubleshooting/page.tsx for common errors (401, 429, 413, 504)

### E2E Tests for User Story 7

- [ ] T151 [P] [US7] Write E2E test for documentation navigation (verify all pages load) in tests/e2e/docs.spec.ts
- [ ] T152 [P] [US7] Write E2E test for code example copy button in tests/e2e/code-examples.spec.ts
- [ ] T153 [P] [US7] Write integration test verifying all code examples work (JS, Python, PHP, Ruby) in tests/integration/examples/

**Checkpoint**: At this point, User Story 7 should be fully functional and testable independently - developers can follow docs to integrate

---

## Phase 10: User Story 8 - Multi-Team API Key Management (Priority: P4)

**Goal**: Enable team leads to track usage per team member using named API keys

**Independent Test**: Create API keys named "Alex - Backend" and "Sarah - Reports", generate PDFs with each, verify usage breakdown in dashboard

### Implementation for User Story 8

- [ ] T154 [P] [US8] Add API key name to usage breakdown query in apps/worker/src/services/usage.service.ts
- [ ] T155 [P] [US8] Update usage by API key table in apps/web/src/components/dashboard/usage-by-key.tsx to show team member names prominently
- [ ] T156 [US8] Add API key search/filter in apps/web/src/app/(dashboard)/api-keys/page.tsx for teams with many keys
- [ ] T157 [US8] Add API key activity log in apps/web/src/components/dashboard/api-key-activity.tsx showing last used timestamp per key

### Integration Tests for User Story 8

- [ ] T158 [P] [US8] Write integration test for multi-key usage tracking (create 5 keys, generate PDFs with each, verify breakdown) in tests/integration/api/multi-key.test.ts

**Checkpoint**: At this point, User Story 8 should be fully functional and testable independently - team leads can manage team API keys

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T159 [P] Update SPEEDSTEIN_API_REFERENCE.md with final endpoint documentation
- [ ] T160 [P] Run Lighthouse CI on all pages, fix issues until score >95 in .github/workflows/lighthouse.yml
- [ ] T161 [P] Audit all colors for OKLCH compliance (no RGB/HSL/hex) using grep and ESLint rule
- [ ] T162 [P] Configure Sentry source maps for Workers and Next.js in wrangler.toml and next.config.js
- [ ] T163 Setup UptimeRobot or BetterStack monitoring for /api/generate and landing page
- [ ] T164 [P] Run check-links CLI tool to verify no 404s in .github/workflows/ci.yml
- [ ] T165 [P] Add JSDoc/TSDoc to all public functions (enforce via ESLint rule @typescript-eslint/explicit-function-return-type)
- [ ] T166 Setup Vitest coverage reports with 80% threshold in vitest.config.ts
- [ ] T167 [P] Optimize Next.js bundle size (analyze with @next/bundle-analyzer, ensure Monaco is dynamically imported)
- [ ] T168 [P] Setup GitHub Actions CI workflow for lint, type-check, test in .github/workflows/ci.yml
- [ ] T169 [P] Setup GitHub Actions deployment workflows for Vercel (apps/web) and Wrangler (apps/worker) in .github/workflows/deploy-*.yml
- [ ] T170 Document deployment process in docs/DEPLOYMENT.md with step-by-step instructions
- [ ] T171 Create database seed script in packages/database/seed.sql for local development with test users and API keys
- [ ] T172 [P] Run quickstart.md validation (follow guide, verify successful PDF generation) manually before launch

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - US1 (REST API): Can start after Foundational - No dependencies on other stories
  - US2 (Landing Page): Depends on US1 being complete (needs /api/generate endpoint)
  - US3 (Auth & API Keys): Can start after Foundational - No dependencies on other stories
  - US4 (Usage Tracking): Depends on US1 and US3 (needs PDF generation and API keys)
  - US5 (Subscriptions): Depends on US3 (needs user accounts)
  - US6 (WebSocket): Depends on US1 (extends REST API with RPC)
  - US7 (Documentation): Depends on US1, US3, US6 (documents all APIs)
  - US8 (Multi-Team): Depends on US3 and US4 (extends API key management)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - independently testable
- **User Story 2 (P1)**: Depends on US1 (calls /api/generate) - independently testable after US1
- **User Story 3 (P2)**: Can start after Foundational - independently testable
- **User Story 4 (P2)**: Depends on US1 + US3 - independently testable after both
- **User Story 5 (P3)**: Depends on US3 - independently testable after US3
- **User Story 6 (P3)**: Depends on US1 - independently testable after US1
- **User Story 7 (P3)**: Depends on US1 + US3 + US6 - independently testable after all three
- **User Story 8 (P4)**: Depends on US3 + US4 - independently testable after both

### Within Each User Story

- Unit tests MUST be written and FAIL before implementation
- Models/types before services
- Services before endpoints
- Core implementation before integration tests
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational completes: US1 and US3 can start in parallel (no dependencies)
- US2 can start after US1 completes
- US4 can start after US1 + US3 complete
- US5 and US6 can run in parallel after their dependencies (US3 and US1 respectively)
- All unit tests within a story marked [P] can run in parallel
- All integration tests within a story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all unit tests for User Story 1 together:
Task: "Write unit test for API key hashing utility"
Task: "Write unit test for HTML validation with Zod schema"
Task: "Write unit test for quota checking logic"
Task: "Write unit test for PDF generation options parsing"

# After tests written, launch model/type creation in parallel:
Task: "Create PdfOptions and PdfResult types"
Task: "Create ApiError class"

# After models complete, launch all integration tests in parallel:
Task: "Write integration test for POST /api/generate with valid HTML"
Task: "Write integration test for POST /api/generate with custom options"
Task: "Write integration test for POST /api/generate with invalid HTML"
Task: "Write integration test for quota enforcement"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (REST API PDF Generation)
4. Complete Phase 4: User Story 2 (Landing Page Demo)
5. **STOP and VALIDATE**: Test both stories independently, verify P95 <2s, LCP <2s
6. Deploy to staging, gather feedback

**MVP Deliverable**: Working landing page with live demo + REST API for PDF generation

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (REST API MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Landing Page MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (Auth & API Keys - revenue unlock!)
5. Add User Story 4 → Test independently → Deploy/Demo (Usage Dashboard)
6. Add User Story 5 → Test independently → Deploy/Demo (Subscriptions - full revenue!)
7. Add User Story 6 → Test independently → Deploy/Demo (WebSocket - enterprise feature)
8. Add User Story 7 → Test independently → Deploy/Demo (Documentation - adoption)
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (REST API)
   - Developer B: User Story 3 (Auth & API Keys)
3. After US1 completes:
   - Developer C: User Story 2 (Landing Page, depends on US1)
4. After US1 + US3 complete:
   - Developer D: User Story 4 (Usage Tracking, depends on both)
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Unit tests must fail before implementing (TDD approach per constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

**Total Tasks**: 172
**By User Story**:
- Setup (Phase 1): 10 tasks
- Foundational (Phase 2): 17 tasks
- User Story 1 (P1 - REST API): 22 tasks (4 unit tests, 14 implementation, 4 integration tests)
- User Story 2 (P1 - Landing Page): 20 tasks (3 unit tests, 13 implementation, 4 E2E tests)
- User Story 3 (P2 - Auth & API Keys): 19 tasks (3 unit tests, 13 implementation, 4 integration tests)
- User Story 4 (P2 - Usage Tracking): 17 tasks (3 unit tests, 11 implementation, 3 integration tests)
- User Story 5 (P3 - Subscriptions): 19 tasks (3 unit tests, 12 implementation, 4 integration tests)
- User Story 6 (P3 - WebSocket): 14 tasks (3 unit tests, 7 implementation, 4 integration tests)
- User Story 7 (P3 - Documentation): 14 tasks (0 unit tests, 11 implementation, 3 E2E tests)
- User Story 8 (P4 - Multi-Team): 5 tasks (0 unit tests, 4 implementation, 1 integration test)
- Polish (Phase 11): 14 tasks

**Parallel Opportunities**: 87 tasks marked with [P] can run in parallel within their phase
**MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4 (59 tasks total) = Functional landing page + REST API

**Independent Test Criteria**:
- US1: POST HTML → receive PDF URL in <2s ✅
- US2: Visit landing page → edit HTML → generate PDF → see generation time ✅
- US3: Signup → create API key → use in request → revoke → verify 401 ✅
- US4: Generate PDFs → view dashboard → verify usage matches ✅
- US5: Upgrade plan → verify quota increase → receive invoice ✅
- US6: Connect WebSocket → batch generate 100 PDFs → measure throughput >100/min ✅
- US7: Follow quickstart → copy code → generate first PDF ✅
- US8: Create multiple named keys → generate PDFs with each → verify breakdown ✅

**Estimated Timeline**:
- MVP (US1 + US2): 1-2 weeks
- Revenue Unlock (+ US3): 2-3 weeks
- Full Platform (+ US4 + US5): 4-5 weeks
- Enterprise Features (+ US6 + US7 + US8): 6-8 weeks
