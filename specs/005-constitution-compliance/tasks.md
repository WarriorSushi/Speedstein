# Tasks: Constitution Compliance - Production Readiness

**Input**: Design documents from `/specs/005-constitution-compliance/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Testing tasks are included as requested in the specification (Constitution Principle VIII requires comprehensive testing).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a **monorepo** structure:
- Frontend: `apps/web/` (Next.js 15 App Router)
- Backend: `apps/worker/` (Cloudflare Workers)
- Shared: `packages/shared/` (TypeScript types, utilities)
- Tests: `tests/` (E2E, integration, unit)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and OKLCH design system foundation

- [ ] T001 Run database migrations for subscriptions and payment events tables (supabase/migrations/20251027000002_add_subscriptions.sql, 20251027000003_add_payment_events.sql, 20251027000004_extend_users.sql)
- [ ] T002 [P] Install shadcn/ui CLI and initialize with Next.js 15 (apps/web: npx shadcn-ui@latest init)
- [ ] T003 [P] Configure OKLCH design tokens in apps/web/app/globals.css with gray scale (50-950) and semantic colors
- [ ] T004 [P] Install DodoPayments SDK (apps/worker: pnpm add dodo-payments)
- [ ] T005 [P] Install Monaco Editor for React (apps/web: pnpm add @monaco-editor/react)
- [ ] T006 [P] Install next-themes for dark mode support (apps/web: pnpm add next-themes)
- [ ] T007 [P] Install Sentry SDKs (apps/web: pnpm add @sentry/nextjs, apps/worker: pnpm add @sentry/cloudflare-workers)
- [ ] T008 [P] Install Playwright for E2E testing (pnpm add -D @playwright/test)
- [ ] T009 [P] Configure Playwright with test database setup in playwright.config.ts
- [ ] T010 [P] Install axe-core for accessibility testing (pnpm add -D @axe-core/playwright)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 Create shared subscription types in packages/shared/src/types/subscription.ts (Subscription, SubscriptionTier, SubscriptionStatus, BillingCycle)
- [ ] T012 Create shared webhook types in packages/shared/src/types/webhook.ts (WebhookEvent, PaymentEvent, DodoPaymentPayload)
- [ ] T013 Configure Tailwind with OKLCH tokens in apps/web/tailwind.config.ts (reference custom properties from globals.css)
- [ ] T014 Create OKLCH color utilities in apps/web/lib/colors.ts (contrast calculation, lightness manipulation)
- [ ] T015 Implement Sentry configuration in apps/web/sentry.client.config.ts and apps/web/sentry.server.config.ts
- [ ] T016 Implement Sentry configuration in apps/worker/src/lib/monitoring.ts with context enrichment
- [ ] T017 Create DodoPayments client wrapper in apps/web/lib/dodo-payments.ts (initialize SDK, handle errors)
- [ ] T018 Create Supabase browser client in apps/web/lib/supabase/client.ts
- [ ] T019 Create Supabase server client in apps/web/lib/supabase/server.ts (for Server Components and API routes)
- [ ] T020 Implement auth middleware in apps/web/middleware.ts (protect dashboard routes, redirect unauthenticated users)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Marketing Site Visitor (Priority: P1) 🎯 MVP

**Goal**: Build landing page with live Monaco editor demo that loads in <2s, allowing visitors to generate PDFs without authentication

**Independent Test**: Visit landing page at localhost:3000, verify LCP <2s via Lighthouse, type HTML in Monaco editor, click "Generate PDF", verify PDF downloads without login

### Implementation for User Story 1

- [X] T021 [P] [US1] Install shadcn/ui button component (apps/web: npx shadcn-ui@latest add button)
- [X] T022 [P] [US1] Install shadcn/ui card component (apps/web: npx shadcn-ui@latest add card)
- [X] T023 [P] [US1] Install shadcn/ui input component (apps/web: npx shadcn-ui@latest add input)
- [X] T024 [P] [US1] Install shadcn/ui dialog component (apps/web: npx shadcn-ui@latest add dialog)
- [X] T025 [P] [US1] Create ThemeProvider component in apps/web/components/theme-provider.tsx (wrap app with next-themes)
- [X] T026 [P] [US1] Create ThemeToggle component in apps/web/components/theme-toggle.tsx (sun/moon icon, toggles dark mode)
- [X] T027 [US1] Update root layout in apps/web/app/layout.tsx (add ThemeProvider, dark mode class support)
- [X] T028 [P] [US1] Create Monaco editor demo component in apps/web/components/monaco-demo.tsx (dynamic import, HTML syntax highlighting, onChange debounced)
- [X] T029 [P] [US1] Create marketing layout in apps/web/app/(marketing)/layout.tsx (header with logo and theme toggle, footer)
- [X] T030 [US1] Create landing page in apps/web/app/(marketing)/page.tsx (hero section, Monaco demo, pricing tiers, CTA buttons)
- [X] T031 [US1] Create pricing page in apps/web/app/(marketing)/pricing/page.tsx (pricing table with Free/Starter/Pro/Enterprise tiers)
- [X] T032 [US1] Implement PDF generation for demo in landing page (call /api/generate without auth, handle response)
- [X] T033 [US1] Add responsive breakpoints for mobile/tablet/desktop in landing page components

### Testing for User Story 1

- [X] T034 [P] [US1] E2E test for landing page load time in tests/e2e/demo.spec.ts (measure LCP, assert <2s)
- [X] T035 [P] [US1] E2E test for Monaco demo flow in tests/e2e/demo.spec.ts (type HTML, generate PDF, verify download)
- [X] T036 [P] [US1] Accessibility test for landing page in tests/e2e/demo.spec.ts (axe-core WCAG AAA validation)
- [X] T037 [P] [US1] Dark mode test in tests/e2e/demo.spec.ts (toggle dark mode, verify OKLCH colors persist)

**Checkpoint**: At this point, User Story 1 should be fully functional - landing page loads fast, demo works, tests pass

---

## Phase 4: User Story 2 - New User Registration & Authentication (Priority: P1)

**Goal**: Enable users to sign up, verify email, log in, and access dashboard with API key management

**Independent Test**: Complete signup flow (email/password → verification email → login → dashboard), generate API key, verify key works for PDF generation

### Implementation for User Story 2

- [ ] T038 [P] [US2] Install shadcn/ui form component (apps/web: npx shadcn-ui@latest add form)
- [ ] T039 [P] [US2] Install shadcn/ui label component (apps/web: npx shadcn-ui@latest add label)
- [ ] T040 [P] [US2] Install shadcn/ui toast component for notifications (apps/web: npx shadcn-ui@latest add toast)
- [ ] T041 [P] [US2] Create auth layout in apps/web/app/(auth)/layout.tsx (centered card, logo, back to home link)
- [ ] T042 [P] [US2] Create signup page in apps/web/app/(auth)/signup/page.tsx (email/password form, Supabase signUp, send verification email)
- [ ] T043 [P] [US2] Create login page in apps/web/app/(auth)/login/page.tsx (email/password form, Supabase signInWithPassword, redirect to dashboard)
- [ ] T044 [P] [US2] Create email verification page in apps/web/app/(auth)/verify/page.tsx (verify token from email link, update email_verified)
- [ ] T045 [P] [US2] Create password reset request page in apps/web/app/(auth)/reset-password/page.tsx (email input, generate reset token)
- [ ] T046 [P] [US2] Create password reset confirmation page in apps/web/app/(auth)/reset-password/confirm/page.tsx (new password input, verify token)
- [ ] T047 [P] [US2] Create dashboard layout in apps/web/app/(dashboard)/layout.tsx (navigation sidebar with links to home/api-keys/subscription/billing, logout button)
- [ ] T048 [P] [US2] Create QuotaIndicator component in apps/web/components/quota-indicator.tsx (real-time quota display, progress bar, upgrade prompt at 80%+)
- [ ] T049 [US2] Create dashboard home page in apps/web/app/(dashboard)/page.tsx (quota indicator, recent PDF generations, quick stats)
- [ ] T050 [US2] Create API keys management page in apps/web/app/(dashboard)/api-keys/page.tsx (list keys, generate new key modal, revoke key, one-time display warning)
- [ ] T051 [US2] Implement auth service in apps/worker/src/services/auth.service.ts (signup, login, email verification, password reset logic)
- [ ] T052 [US2] Add auth API routes in apps/worker/src/index.ts (POST /api/auth/signup, POST /api/auth/login, POST /api/auth/verify, POST /api/auth/reset-password)

### Testing for User Story 2

- [ ] T053 [P] [US2] E2E test for signup flow in tests/e2e/signup.spec.ts (fill form, submit, verify email sent)
- [ ] T054 [P] [US2] E2E test for login flow in tests/e2e/login.spec.ts (login with credentials, redirect to dashboard)
- [ ] T055 [P] [US2] E2E test for API key generation in tests/e2e/api-keys.spec.ts (generate key, verify one-time display, test key with PDF generation)
- [ ] T056 [P] [US2] Integration test for auth endpoints in tests/integration/auth.test.ts (test signup/login/verify endpoints)
- [ ] T057 [P] [US2] Unit test for auth middleware in tests/unit/middleware.test.ts (test redirect logic)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - landing page + full auth flow complete

---

## Phase 5: User Story 3 - Subscription Management & Payments (Priority: P1)

**Goal**: Enable users to upgrade subscription tiers via DodoPayments, process webhooks, and update quotas automatically

**Independent Test**: Navigate to pricing page, click "Upgrade to Starter", complete DodoPayments checkout, verify subscription activated and quota increased on dashboard

### Implementation for User Story 3

- [ ] T058 [P] [US3] Install shadcn/ui badge component (apps/web: npx shadcn-ui@latest add badge)
- [ ] T059 [P] [US3] Install shadcn/ui table component (apps/web: npx shadcn-ui@latest add table)
- [ ] T060 [P] [US3] Create SubscriptionCard component in apps/web/components/subscription-card.tsx (tier selector, pricing display, upgrade button)
- [ ] T061 [P] [US3] Create subscription management page in apps/web/app/(dashboard)/subscription/page.tsx (current tier display, upgrade/downgrade options, cancel button)
- [ ] T062 [P] [US3] Create billing history page in apps/web/app/(dashboard)/billing/page.tsx (payment events table, invoice links)
- [ ] T063 [US3] Implement payment service in apps/worker/src/services/payment.service.ts (create subscription, update tier, cancel subscription)
- [ ] T064 [US3] Implement webhook signature verification in apps/worker/src/services/webhook.service.ts (HMAC-SHA256 validation)
- [ ] T065 [US3] Implement DodoPayments webhook handler in apps/worker/src/webhooks/dodo.ts (subscription.created, payment.succeeded, payment.failed, subscription.cancelled)
- [ ] T066 [US3] Add webhook endpoint in apps/worker/src/index.ts (POST /api/webhooks/dodo with signature verification)
- [ ] T067 [US3] Add subscription API endpoints in apps/worker/src/index.ts (GET /api/subscription, POST /api/subscription, PATCH /api/subscription, DELETE /api/subscription)
- [ ] T068 [US3] Update quota limits after subscription changes (trigger from webhook, sync quota_usage table with new tier limits)
- [ ] T069 [US3] Add upgrade prompt to QuotaIndicator when usage >= 80%

### Testing for User Story 3

- [ ] T070 [P] [US3] E2E test for subscription upgrade flow in tests/e2e/payment.spec.ts (click upgrade, complete checkout, verify quota updated)
- [ ] T071 [P] [US3] E2E test for subscription cancellation in tests/e2e/payment.spec.ts (cancel subscription, verify effective date)
- [ ] T072 [P] [US3] Integration test for webhook handling in tests/integration/webhooks.test.ts (send test webhook, verify signature, verify processing)
- [ ] T073 [P] [US3] Integration test for subscription API in tests/integration/subscription.test.ts (test CRUD operations)
- [ ] T074 [P] [US3] Unit test for webhook signature verification in tests/unit/webhook.test.ts (test HMAC validation)

**Checkpoint**: All P1 user stories complete - MVP is ready for deployment (landing page + auth + payments)

---

## Phase 6: User Story 4 - Developer Using the API (Priority: P2)

**Goal**: Provide comprehensive API documentation with multi-language code examples and ensure R2 URL returns

**Independent Test**: Follow API docs to generate PDF in JavaScript/Python/PHP/Ruby, verify R2 URL returned (not buffer), check quota decremented

### Implementation for User Story 4

- [ ] T075 [P] [US4] Fix R2 integration in apps/worker/src/index.ts (call uploadPdfToR2 after generation, return public URL instead of buffer)
- [ ] T076 [P] [US4] Fix PdfGeneratorApi in apps/worker/src/rpc/pdf-generator-api.ts (add persistent browser reference, implement Symbol.dispose())
- [ ] T077 [P] [US4] Create API documentation page in apps/web/app/docs/page.tsx (endpoint list, authentication guide, rate limits)
- [ ] T078 [P] [US4] Create JavaScript examples in apps/web/app/docs/javascript/page.tsx (code snippets for PDF generation, batch processing)
- [ ] T079 [P] [US4] Create Python examples in apps/web/app/docs/python/page.tsx (code snippets for PDF generation, batch processing)
- [ ] T080 [P] [US4] Create PHP examples in apps/web/app/docs/php/page.tsx (code snippets for PDF generation, batch processing)
- [ ] T081 [P] [US4] Create Ruby examples in apps/web/app/docs/ruby/page.tsx (code snippets for PDF generation, batch processing)
- [ ] T082 [US4] Update SPEEDSTEIN_API_REFERENCE.md with new endpoints (subscription API, webhook API, auth API)

### Testing for User Story 4

- [ ] T083 [P] [US4] E2E test for PDF generation via API in tests/e2e/pdf-generation.spec.ts (send request, verify R2 URL returned, download PDF)
- [ ] T084 [P] [US4] E2E test for batch processing in tests/e2e/pdf-generation.spec.ts (send 10 PDFs, verify all complete in <2s)
- [ ] T085 [P] [US4] Integration test for R2 upload in tests/integration/r2.test.ts (verify tier metadata, expiration dates)

**Checkpoint**: API documentation complete, R2 integration fixed, all endpoints return URLs

---

## Phase 7: User Story 5 - Performance Validation & Monitoring (Priority: P2)

**Goal**: Validate P95 latency <2s, 100+ PDFs/minute throughput, 80%+ browser reuse, Sentry error tracking works

**Independent Test**: Run load test script (scripts/load-test.mjs), verify P95 <2s, trigger test error to verify Sentry capture

### Implementation for User Story 5

- [ ] T086 [P] [US5] Create K6 load test script in scripts/load-test.mjs (ramp to 100 VUs, hold 5 minutes, measure P95 latency)
- [ ] T087 [P] [US5] Create performance metrics collection script in scripts/measure-performance.mjs (query Cloudflare Analytics API for P95/P99)
- [ ] T088 [P] [US5] Create Lighthouse CI script in scripts/lighthouse-ci.sh (run on landing page, assert 95+ score)
- [ ] T089 [P] [US5] Configure Sentry source map upload in apps/web/next.config.js (sentry-cli sourcemaps upload)
- [ ] T090 [P] [US5] Configure Sentry source map upload in apps/worker/wrangler.toml (upload after build)
- [ ] T091 [US5] Add performance monitoring dashboard queries (browser pool reuse rate, quota usage trends)
- [ ] T092 [US5] Test Sentry error capture (trigger test error, verify Sentry dashboard shows stack trace with context)

### Testing for User Story 5

- [ ] T093 [US5] Run K6 load test and verify P95 latency <2s (execute scripts/load-test.mjs, analyze results)
- [ ] T094 [US5] Run Lighthouse CI on all pages and verify 95+ score (execute scripts/lighthouse-ci.sh)
- [ ] T095 [US5] Verify browser pool reuse rate 80%+ (check BrowserPoolDO metrics over 1 hour)

**Checkpoint**: Performance targets validated, monitoring infrastructure operational

---

## Phase 8: User Story 6 - Comprehensive Testing Coverage (Priority: P3)

**Goal**: Achieve 80%+ code coverage with unit/integration/E2E tests, automate in CI/CD

**Independent Test**: Run full test suite (pnpm test:all), generate coverage report, verify 80%+ coverage

### Implementation for User Story 6

- [ ] T096 [P] [US6] Create unit tests for Monaco demo component in tests/unit/components/monaco-demo.test.tsx
- [ ] T097 [P] [US6] Create unit tests for QuotaIndicator component in tests/unit/components/quota-indicator.test.tsx
- [ ] T098 [P] [US6] Create unit tests for SubscriptionCard component in tests/unit/components/subscription-card.test.tsx
- [ ] T099 [P] [US6] Create unit tests for ThemeToggle component in tests/unit/components/theme-toggle.test.tsx
- [ ] T100 [P] [US6] Create unit tests for payment service in tests/unit/services/payment.test.ts
- [ ] T101 [P] [US6] Create unit tests for webhook service in tests/unit/services/webhook.test.ts
- [ ] T102 [P] [US6] Create unit tests for auth service in tests/unit/services/auth.test.ts
- [ ] T103 [P] [US6] Create unit tests for OKLCH color utilities in tests/unit/lib/colors.test.ts
- [ ] T104 [US6] Configure code coverage measurement in vitest.config.ts (coverage reporter, thresholds)
- [ ] T105 [US6] Create coverage measurement script in scripts/measure-coverage.sh (generate HTML report, check 80%+ threshold)
- [ ] T106 [US6] Configure GitHub Actions CI pipeline in .github/workflows/ci.yml (run tests on PR, block merge if coverage <80%)

### Testing for User Story 6

- [ ] T107 [US6] Run full test suite and verify all tests pass (pnpm test:all)
- [ ] T108 [US6] Generate coverage report and verify 80%+ coverage (pnpm run coverage)

**Checkpoint**: All tests passing, coverage target met, CI/CD configured

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, final deployment preparation

- [ ] T109 [P] Update README.md with frontend setup instructions and new dependencies
- [ ] T110 [P] Add JSDoc comments to all public functions in packages/shared/
- [ ] T111 [P] Add inline comments to complex logic (OKLCH manipulation, webhook processing)
- [ ] T112 [P] Verify no console.log in production code (ESLint check)
- [ ] T113 [P] Run link validation on all documentation pages
- [ ] T114 Optimize bundle size (analyze with @next/bundle-analyzer, tree-shake unused shadcn components)
- [ ] T115 [P] Configure robots.txt and sitemap.xml for SEO
- [ ] T116 [P] Add meta tags for social sharing (Open Graph, Twitter Cards)
- [ ] T117 Run quickstart.md validation (follow all setup steps, verify they work)
- [ ] T118 Final constitution compliance check (verify all 40 items pass)
- [ ] T119 Deploy to staging environment and run smoke tests
- [ ] T120 Production deployment checklist (environment variables, DNS, SSL, monitoring alerts)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - can start immediately after
- **User Story 2 (Phase 4)**: Depends on Foundational - can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational AND US2 (needs auth for subscription management)
- **User Story 4 (Phase 6)**: Depends on Foundational - can run in parallel with US1/US2/US3
- **User Story 5 (Phase 7)**: Depends on US1/US2/US3/US4 completion (needs full system for load testing)
- **User Story 6 (Phase 8)**: Depends on all user stories (tests validate complete system)
- **Polish (Phase 9)**: Depends on all user stories completion

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Parallel:
                                            ├── US1 (Landing)
                                            ├── US2 (Auth)
                                            ├── US4 (Docs)
                                            └── US3 (Payments) ──depends on→ US2

US1 + US2 + US3 + US4 → US5 (Performance) → US6 (Testing) → Polish
```

**Critical Path**: Setup → Foundational → US2 (Auth) → US3 (Payments) → US5 (Perf) → US6 (Tests) → Polish

**MVP Path**: Setup → Foundational → US1 (Landing) → US2 (Auth) → US3 (Payments) → Deploy

### Within Each User Story

- Tests written first (if TDD approach)
- Shared types before services
- shadcn components installed before page implementation
- Services before API endpoints
- Core pages before integration
- E2E tests last (after feature complete)

### Parallel Opportunities

**Phase 1 (Setup)**: All T001-T010 can run in parallel (different packages)

**Phase 2 (Foundational)**: T011-T020 can run in groups:
- Group A (Types): T011, T012 (parallel)
- Group B (Config): T013, T014, T015, T016, T017 (parallel)
- Group C (Clients): T018, T019, T020 (parallel after Group B)

**Phase 3 (US1)**:
- shadcn installs T021-T024 (parallel)
- Components T025, T026, T028, T029 (parallel after shadcn)
- Tests T034-T037 (parallel after implementation)

**Phase 4 (US2)**:
- shadcn installs T038-T040 (parallel)
- Auth pages T042-T046 (parallel after T041)
- Dashboard pages T048-T050 (parallel after T047)
- Tests T053-T057 (parallel after implementation)

**Phase 5 (US3)**:
- shadcn installs T058-T059 (parallel)
- Components T060, T061, T062 (parallel)
- Tests T070-T074 (parallel after implementation)

**Phase 6 (US4)**:
- All doc pages T077-T081 (parallel)
- Tests T083-T085 (parallel after implementation)

**Phase 7 (US5)**:
- All scripts T086-T088 (parallel)
- Config T089-T090 (parallel)

**Phase 8 (US6)**:
- All unit tests T096-T103 (parallel)

**Phase 9 (Polish)**:
- All docs T109-T116 (parallel)

---

## Parallel Example: User Story 1

```bash
# Launch shadcn component installations together:
Task T021: "Install shadcn/ui button component"
Task T022: "Install shadcn/ui card component"
Task T023: "Install shadcn/ui input component"
Task T024: "Install shadcn/ui dialog component"

# Launch component implementations together:
Task T025: "Create ThemeProvider component"
Task T026: "Create ThemeToggle component"
Task T028: "Create Monaco editor demo component"

# Launch all tests together:
Task T034: "E2E test for landing page load time"
Task T035: "E2E test for Monaco demo flow"
Task T036: "Accessibility test for landing page"
Task T037: "Dark mode test"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T020) - CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 - Landing Page (T021-T037)
4. Complete Phase 4: User Story 2 - Auth (T038-T057)
5. Complete Phase 5: User Story 3 - Payments (T058-T074)
6. **STOP and VALIDATE**: Test all three stories independently
7. Deploy MVP to staging/production

**Estimated Tasks for MVP**: 74 tasks (T001-T074)

### Incremental Delivery

1. **Foundation** (T001-T020): Setup + Foundational → Can test infrastructure
2. **MVP Increment 1** (T021-T037): Add Landing Page → Demo works, no auth
3. **MVP Increment 2** (T038-T057): Add Auth → Users can sign up, get API keys
4. **MVP Increment 3** (T058-T074): Add Payments → Monetization enabled ✅ DEPLOY
5. **Enhancement 1** (T075-T085): Add Docs → Better DX
6. **Enhancement 2** (T086-T095): Add Performance Validation → Production confidence
7. **Enhancement 3** (T096-T108): Add Testing Coverage → CI/CD ready
8. **Polish** (T109-T120): Final cleanup → Launch

### Parallel Team Strategy

With 3 developers after Foundational phase (T020) complete:

- **Developer A**: User Story 1 (Landing Page) - T021-T037
- **Developer B**: User Story 2 (Auth) - T038-T057 (some dependency on A for layout structure)
- **Developer C**: User Story 4 (Docs) - T075-T085

After US1 + US2 complete:
- **Developer A**: User Story 3 (Payments) - T058-T074 (needs US2 auth)
- **Developer B**: User Story 5 (Performance) - T086-T095
- **Developer C**: User Story 6 (Testing) - T096-T108

---

## Task Summary

**Total Tasks**: 120 tasks
- Phase 1 (Setup): 10 tasks (T001-T010)
- Phase 2 (Foundational): 10 tasks (T011-T020)
- Phase 3 (US1 - Landing): 17 tasks (T021-T037)
- Phase 4 (US2 - Auth): 20 tasks (T038-T057)
- Phase 5 (US3 - Payments): 17 tasks (T058-T074)
- Phase 6 (US4 - Docs): 11 tasks (T075-T085)
- Phase 7 (US5 - Performance): 10 tasks (T086-T095)
- Phase 8 (US6 - Testing): 13 tasks (T096-T108)
- Phase 9 (Polish): 12 tasks (T109-T120)

**MVP Scope**: T001-T074 (74 tasks) - Landing + Auth + Payments
**Parallel Opportunities**: 57 tasks marked [P] can run in parallel within their phase
**Independent Tests**: Each user story has 3-7 test tasks to validate independently

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests written after implementation (not TDD, but comprehensive)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Architecture fixes (R2 integration, PdfGeneratorApi) included in US4
- All tasks follow Constitution principles (OKLCH, shadcn/ui, DodoPayments, Sentry, etc.)
