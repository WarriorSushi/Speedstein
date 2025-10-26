# Tasks: Architecture Alignment - Durable Objects, Cap'n Web RPC, and Performance Optimization

**Input**: Design documents from `/specs/002-architecture-alignment/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. P1 stories (US1, US2, US5) focus on core performance architecture. P2 stories (US3, US4) handle configuration fixes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Durable Objects configuration

- [x] T001 Create directory structure: apps/worker/src/durable-objects/, apps/worker/src/types/
- [x] T002 Add Durable Object binding to apps/worker/wrangler.toml (BROWSER_POOL_DO namespace)
- [x] T003 [P] Create TypeScript types file apps/worker/src/types/durable-objects.ts with BrowserPoolState, BrowserInstance, QueuedRequest, RpcSessionMetadata interfaces
- [x] T004 [P] Create directory apps/worker/test/durable-objects/ for DO unit tests
- [x] T005 [P] Create directory apps/worker/test/rpc/ for RPC integration tests
- [x] T006 [P] Create directory apps/worker/test/e2e/ for E2E tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Durable Object browser pool that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement BrowserPoolDO class skeleton in apps/worker/src/durable-objects/BrowserPoolDO.ts with constructor, fetch handler, state property
- [x] T008 Add BrowserPoolDO export to apps/worker/src/index.ts for Durable Object binding
- [x] T009 Implement acquireBrowser() method in BrowserPoolDO to launch Chrome via @cloudflare/puppeteer
- [x] T010 Implement releaseBrowser() method in BrowserPoolDO to return browser to pool or close if idle
- [x] T011 Implement recycleBrowser() method in BrowserPoolDO to handle crashed instances (close, remove from pool, initialize new)
- [x] T012 Implement cleanup() method in BrowserPoolDO for 5-minute idle timeout (close idle browsers, update state)
- [x] T013 Implement browser instance recycling logic in BrowserPoolDO (recycle after 1000 PDFs or 1 hour, whichever first)
- [x] T014 Add error handling to BrowserPoolDO methods with try-catch blocks and logging
- [x] T015 Add request queuing to BrowserPoolDO with 5-second max wait time and 503 response on timeout
- [x] T016 Create browser pool manager utility in apps/worker/src/lib/browser-pool-manager.ts (DO stub creation, routing by user ID hash)
- [x] T017 Add Zod schema validation for BrowserPoolState in apps/worker/src/lib/validation.ts

**Checkpoint**: Browser pool Durable Object foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - High-Volume Batch PDF Generation (Priority: P1) 🎯 MVP

**Goal**: Enable enterprise customers to generate 500+ PDFs via WebSocket with promise pipelining, achieving 100+ PDFs/min throughput with <2s P95 latency using Durable Objects browser session pooling

**Independent Test**: Establish WebSocket connection to `/api/rpc`, send batch of 100 PDF generation requests using Cap'n Web promise pipelining, measure throughput (must achieve 100+ PDFs/min) and P95 latency (must be <2s)

### Implementation for User Story 1

- [x] T018 [P] [US1] Create PdfGeneratorApi class extending RpcTarget in apps/worker/src/rpc/PdfGeneratorApi.ts
- [x] T019 [US1] Implement generatePdf(html: string, options: PdfOptions) method in PdfGeneratorApi returning Promise<PdfResult>
- [x] T020 [US1] Implement generateBatch(jobs: PdfJob[]) method in PdfGeneratorApi using Promise.all for concurrent processing
- [x] T021 [US1] Implement ping() method in PdfGeneratorApi returning "pong" string
- [x] T022 [US1] Add Zod schema validation for generatePdf parameters in PdfGeneratorApi
- [x] T023 [US1] Add Zod schema validation for generateBatch parameters in PdfGeneratorApi
- [x] T024 [US1] Implement Symbol.dispose() for PdfGeneratorApi resource cleanup
- [x] T025 [US1] Create WebSocket upgrade middleware in apps/worker/src/middleware/websocket.ts using newWorkersRpcResponse from capnweb
- [x] T026 [US1] Add /api/rpc endpoint to apps/worker/src/index.ts routing to WebSocket middleware
- [x] T027 [US1] Implement WebSocket heartbeat mechanism (30-second ping/pong interval) in WebSocket middleware
- [x] T028 [US1] Add WebSocket disconnect handling with graceful cleanup in WebSocket middleware
- [x] T029 [US1] Connect PdfGeneratorApi methods to BrowserPoolDO via browser pool manager (route requests to DO, get warm browser)
- [x] T030 [US1] Update PdfService in apps/worker/src/services/pdf.service.ts to accept Browser instance from DO instead of launching per-request
- [x] T031 [US1] Add structured logging for WebSocket connections, disconnections, and RPC method calls
- [x] T032 [US1] Add error handling for browser crashes in generatePdf/generateBatch (catch, recycle browser, retry with new instance)

**Checkpoint**: WebSocket RPC endpoint functional, batch PDF generation achieves 100+ PDFs/min via Durable Objects browser pooling

---

## Phase 4: User Story 2 - REST API Performance Improvement (Priority: P1)

**Goal**: Route existing REST API requests through Durable Objects browser pool to eliminate cold starts, achieving <2s P95 latency for all users without API changes

**Independent Test**: Make sequential REST API calls to `/api/generate`, measure response times (should consistently achieve <2s P95 latency with browser session reuse vs. 3-5s with cold launches)

### Implementation for User Story 2

- [x] T033 [P] [US2] Create Durable Object routing middleware in apps/worker/src/middleware/durable-object-routing.ts
- [x] T034 [US2] Implement user ID extraction logic in DO routing middleware (from API key or session)
- [x] T035 [US2] Implement DO stub creation and request forwarding in routing middleware (hash user ID → DO ID → get stub → forward request)
- [x] T036 [US2] Add routing middleware to /api/generate endpoint in apps/worker/src/index.ts (apply before PdfService call)
- [x] T037 [US2] Modify PdfService.generatePdf to use browser from DO context instead of SimpleBrowserService
- [x] T038 [US2] Add fallback logic: if DO unavailable, fall back to SimpleBrowserService for zero-downtime deployment
- [x] T039 [US2] Add feature flag in environment variables to toggle DO routing (ENABLE_DURABLE_OBJECTS=true/false)
- [x] T040 [US2] Add structured logging for DO routing (log DO ID, browser acquisition time, PDF generation time)
- [x] T041 [US2] Add performance metrics tracking (P50, P95 latency) in DO routing middleware

**Checkpoint**: REST API requests transparently benefit from Durable Objects browser pooling, backward compatible with existing clients

---

## Phase 5: User Story 5 - WebSocket RPC Endpoint Availability (Priority: P1)

**Goal**: Provide fully functional WebSocket RPC endpoint at `/api/rpc` matching documented API contract, enabling developers to use Cap'n Web client library

**Independent Test**: Establish WebSocket connection to `/api/rpc`, create Cap'n Web RpcStub, call remote methods (generatePdf, generateBatch, ping), verify successful execution

### Implementation for User Story 5

- [x] T042 [P] [US5] Create RPC session metadata tracking in PdfGeneratorApi (sessionId, userId, connectionType, timestamps)
- [x] T043 [P] [US5] Implement HTTP Batch mode support in WebSocket middleware (handle non-WebSocket RPC requests via newWorkersRpcResponse)
- [x] T044 [US5] Add authentication for WebSocket RPC endpoint (validate API key from Authorization header, reject unauthorized)
- [x] T045 [US5] Add rate limiting for WebSocket RPC endpoint (apply existing rate limiting middleware, enforce quota per plan tier)
- [x] T046 [US5] Implement reconnection handling (allow clients to reconnect after disconnect, create new RPC session)
- [x] T047 [US5] Add WebSocket health check endpoint at /api/rpc/health for uptime monitoring
- [x] T048 [US5] Update SPEEDSTEIN_API_REFERENCE.md with WebSocket RPC examples (JavaScript client code, connection URL, method signatures)
- [x] T049 [US5] Create quickstart guide in specs/002-architecture-alignment/quickstart.md with WebSocket RPC connection examples
- [x] T050 [US5] Add JSDoc comments to all PdfGeneratorApi public methods (generatePdf, generateBatch, ping)

**Checkpoint**: WebSocket RPC endpoint fully documented and functional, matches original API specification

---

## Phase 6: User Story 3 - Correct Pricing Tier Configuration (Priority: P2)

**Goal**: Update Pro plan pricing from $99 to $149/month across all systems to match original technical specification and ensure correct billing

**Independent Test**: Review pricing page (displays $149/month for Pro plan), complete upgrade flow to Pro plan, verify charge is exactly $149.00 and quota is 50,000 PDFs

### Implementation for User Story 3

- [x] T051 [P] [US3] Update PRICING_TIERS constant in apps/worker/src/services/pricing.service.ts (change pro.price from 99 to 149)
- [x] T052 [P] [US3] Update pricing reference in specs/001-pdf-api-platform/spec.md (change all $99 Pro plan mentions to $149)
- [x] T053 [P] [US3] Create pricing configuration file apps/worker/src/lib/pricing-config.ts with PricingTierConfig interface
- [x] T054 [US3] Update DodoPayments integration to charge $149 for Pro plan (update product configuration in DodoPayments dashboard)
- [x] T055 [US3] Add validation in billing service to verify Pro plan users have 50,000 PDF quota (prevent quota mismatch)
- [x] T056 [US3] Add logging for Pro plan subscription events (upgrades, downgrades, billing amounts)
- [x] T057 [US3] Document pricing change in README.md or CHANGELOG.md (note: $99 was incorrect, corrected to $149 per original spec)

**Checkpoint**: Pro plan pricing corrected to $149/month across all systems, validated in billing flow

---

## Phase 7: User Story 4 - Automated PDF Storage Cleanup (Priority: P2)

**Goal**: Configure R2 bucket lifecycle policies for automatic PDF deletion based on plan tier (24h free, 7d starter, 30d pro, 90d enterprise) to prevent unbounded storage costs

**Independent Test**: Generate PDFs on different plan tiers, wait for TTL periods to elapse, verify PDFs are deleted per plan retention policy

### Implementation for User Story 4

- [x] T058 [P] [US4] Create R2 lifecycle configuration utility in apps/worker/src/lib/r2-lifecycle.ts with lifecycle rule definitions
- [x] T059 [P] [US4] Define R2 lifecycle rules for each tier (free: 1 day, starter: 7 days, pro: 30 days, enterprise: 90 days)
- [x] T060 [US4] Implement PDF tier tagging in pdf.service.ts (add customMetadata: { tier: userTier } when uploading to R2)
- [x] T061 [US4] Update PdfService.uploadToR2 to include plan tier tag from user's subscription data
- [x] T062 [US4] Configure R2 bucket lifecycle policies via Cloudflare API or dashboard (apply rules defined in r2-lifecycle.ts)
- [x] T063 [US4] Add logging for PDF uploads with tier tags (log user ID, tier, PDF key, upload timestamp)
- [x] T064 [US4] Implement 404 error handler for expired PDFs (return user-friendly message: "PDF expired per [tier] plan retention policy")
- [x] T065 [US4] Add R2 lifecycle policy documentation to README.md (explain retention periods, how to verify cleanup)

**Checkpoint**: R2 lifecycle policies configured, PDFs automatically deleted per plan tier, storage costs bounded

---

## Phase 8: Integration & Performance Validation

**Purpose**: End-to-end testing and performance validation across all user stories

- [ ] T066 [P] Create E2E test for WebSocket RPC batch PDF generation in apps/worker/test/e2e/websocket-rpc.spec.ts (100 PDFs in <60s)
- [ ] T067 [P] Create E2E test for REST API performance with DO routing in apps/worker/test/e2e/rest-api-performance.spec.ts (<2s P95)
- [ ] T068 [P] Create unit test for BrowserPoolDO browser acquisition in apps/worker/test/durable-objects/BrowserPoolDO.test.ts
- [ ] T069 [P] Create unit test for BrowserPoolDO browser recycling logic in apps/worker/test/durable-objects/BrowserPoolDO.test.ts
- [ ] T070 [P] Create unit test for BrowserPoolDO idle cleanup in apps/worker/test/durable-objects/BrowserPoolDO.test.ts
- [ ] T071 [P] Create integration test for PdfGeneratorApi.generatePdf in apps/worker/test/rpc/PdfGeneratorApi.test.ts
- [ ] T072 [P] Create integration test for PdfGeneratorApi.generateBatch with promise pipelining in apps/worker/test/rpc/PdfGeneratorApi.test.ts
- [ ] T073 [P] Create load test scenario for 100 concurrent users using k6 or Artillery (validate 100+ PDFs/min throughput)
- [ ] T074 [P] Create load test scenario for 10,000 concurrent requests across Durable Objects (validate system capacity)
- [ ] T075 Create performance benchmark script to measure P50 and P95 latency (run 1000 requests, calculate percentiles)
- [ ] T076 Run performance validation: verify P95 <2s, P50 <1.5s, 100+ PDFs/min throughput (MUST PASS before deployment)
- [ ] T077 Run all tests with Vitest (unit + integration) and verify 80%+ code coverage for DO and RPC code
- [ ] T078 Verify zero-downtime deployment: test fallback to SimpleBrowserService when DO unavailable

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, monitoring, and production readiness

- [ ] T079 [P] Update main README.md with Durable Objects setup instructions (wrangler.toml configuration, DO bindings)
- [ ] T080 [P] Update SPEEDSTEIN_API_REFERENCE.md with complete WebSocket RPC documentation (connection examples, method signatures, error codes)
- [ ] T081 [P] Add JSDoc/TSDoc comments to all public functions in BrowserPoolDO, PdfGeneratorApi, browser-pool-manager
- [ ] T082 [P] Add inline comments for complex logic (DO routing algorithm, promise pipelining, browser recycling conditions)
- [ ] T083 [P] Create .env.example with all required environment variables (ENABLE_DURABLE_OBJECTS, R2 bucket names, DO namespace)
- [ ] T084 Add Sentry error tracking for Durable Object errors, WebSocket errors, browser crashes
- [ ] T085 Add structured logging for critical operations (DO lifecycle events, browser creation/recycling, WebSocket connections/disconnects, R2 PDF deletions)
- [ ] T086 Configure uptime monitoring for /api/rpc/health endpoint (add to existing UptimeRobot or BetterStack)
- [ ] T087 Create deployment runbook for gradual rollout (enable DO routing for 10% traffic → 50% → 100%, rollback procedure)
- [ ] T088 Remove or deprecate SimpleBrowserService code (mark as deprecated, add migration guide to DO-based approach)
- [ ] T089 Code cleanup: remove console.log statements, ensure all logging uses structured logger (Winston/Pino)
- [ ] T090 Security review: verify no plaintext secrets, API keys hashed, RLS policies unchanged, rate limiting applied
- [ ] T091 Run quickstart.md validation (follow guide step-by-step, verify all examples work)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - P1 priority
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - P1 priority, can run in parallel with US1
- **User Story 5 (Phase 5)**: Depends on User Story 1 (Phase 3) - builds on WebSocket RPC from US1
- **User Story 3 (Phase 6)**: Depends on Foundational (Phase 2) - P2 priority, independent of US1/US2/US5
- **User Story 4 (Phase 7)**: Depends on Foundational (Phase 2) - P2 priority, independent of other stories
- **Integration & Performance (Phase 8)**: Depends on completion of US1, US2, US5 (P1 stories)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core WebSocket RPC implementation
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1, can run in parallel
- **User Story 5 (P1)**: Depends on User Story 1 - Extends WebSocket RPC with full endpoint functionality
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of all other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent of all other stories

### Within Each User Story

- Durable Object foundation (Phase 2) MUST complete first
- RpcTarget implementation before WebSocket endpoint
- WebSocket middleware before endpoint registration
- Core implementation before error handling and logging
- All P1 stories (US1, US2, US5) before performance validation

### Parallel Opportunities

- **Phase 1 (Setup)**: All tasks T001-T006 can run in parallel
- **Phase 2 (Foundational)**: T003-T006 (directory creation) can run in parallel, T014-T017 (validation, error handling) can run in parallel after core DO implementation
- **Phase 3 (US1)**: T018-T024 (RpcTarget methods) can run in parallel, T025-T028 (WebSocket middleware) can run in parallel
- **Phase 4 (US2)**: Can run entire phase in parallel with Phase 3 (US1) if team capacity allows
- **Phase 6 (US3)**: All tasks T051-T053 (config updates) can run in parallel
- **Phase 7 (US4)**: T058-T059 (R2 lifecycle rules) can run in parallel
- **Phase 8 (Integration)**: All test creation tasks T066-T074 can run in parallel, then execute tests sequentially
- **Phase 9 (Polish)**: All documentation tasks T079-T083 can run in parallel

---

## Parallel Example: User Story 1 (WebSocket RPC)

```bash
# Launch all RpcTarget method implementations in parallel:
Task: "T018 - Create PdfGeneratorApi class extending RpcTarget"
Task: "T019 - Implement generatePdf method"
Task: "T020 - Implement generateBatch method"
Task: "T021 - Implement ping method"
Task: "T022 - Add Zod validation for generatePdf"
Task: "T023 - Add Zod validation for generateBatch"
Task: "T024 - Implement Symbol.dispose"

# Then launch all WebSocket middleware tasks in parallel:
Task: "T025 - Create WebSocket upgrade middleware"
Task: "T026 - Add /api/rpc endpoint"
Task: "T027 - Implement heartbeat mechanism"
Task: "T028 - Add disconnect handling"
```

---

## Parallel Example: User Story 2 (REST API Routing)

```bash
# Can work on US2 entirely in parallel with US1 if team has capacity:
Task: "T033 - Create DO routing middleware"
Task: "T034 - Implement user ID extraction"
Task: "T035 - Implement DO stub creation"
Task: "T036 - Add routing to /api/generate"
Task: "T037 - Modify PdfService for DO browsers"
Task: "T038 - Add SimpleBrowserService fallback"
Task: "T039 - Add feature flag"
```

---

## Implementation Strategy

### MVP First (P1 Stories: US1 + US2 + US5)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational - **CRITICAL BLOCKER** (T007-T017)
3. Complete Phase 3: User Story 1 - WebSocket RPC core (T018-T032)
4. Complete Phase 4: User Story 2 - REST API routing (T033-T041)
5. Complete Phase 5: User Story 5 - WebSocket endpoint completion (T042-T050)
6. Complete Phase 8: Integration & Performance Validation (T066-T078) - **MUST PASS**
7. **STOP and VALIDATE**: Run load tests, verify 100+ PDFs/min, P95 <2s
8. Deploy P1 features, monitor performance in production

### Incremental Delivery (Add P2 Stories After MVP)

1. MVP deployed and validated (US1, US2, US5 complete)
2. Add Phase 6: User Story 3 - Pricing correction (T051-T057)
3. Add Phase 7: User Story 4 - R2 lifecycle policies (T058-T065)
4. Complete Phase 9: Polish & Documentation (T079-T091)
5. Final production deployment with all features

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (T001-T017)
2. Once Foundational is done:
   - **Developer A**: User Story 1 - WebSocket RPC (T018-T032)
   - **Developer B**: User Story 2 - REST API routing (T033-T041)
   - **Developer C**: User Story 3 + 4 - Config fixes (T051-T065)
3. Developer A completes US1, then does User Story 5 (T042-T050)
4. All developers collaborate on Performance Validation (T066-T078)
5. Divide Polish tasks across team (T079-T091)

---

## Task Summary

### Total Tasks: 91

**By Phase:**
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 11 tasks ⚠️ **BLOCKS ALL USER STORIES**
- Phase 3 (US1 - Batch PDF): 15 tasks (P1)
- Phase 4 (US2 - REST Performance): 9 tasks (P1)
- Phase 5 (US5 - WebSocket Endpoint): 9 tasks (P1)
- Phase 6 (US3 - Pricing): 7 tasks (P2)
- Phase 7 (US4 - R2 Lifecycle): 8 tasks (P2)
- Phase 8 (Integration & Performance): 13 tasks
- Phase 9 (Polish): 13 tasks

**By Priority:**
- P1 (Critical Architecture): 33 tasks (US1 + US2 + US5)
- P2 (Configuration Fixes): 15 tasks (US3 + US4)
- Infrastructure: 30 tasks (Setup + Foundational + Integration + Polish)

**Parallelizable Tasks**: 43 tasks marked with [P]

**Independent Test Criteria:**
- **US1**: WebSocket batch generation achieves 100+ PDFs/min with <2s P95 latency
- **US2**: REST API achieves <2s P95 latency with DO routing vs. 3-5s without
- **US5**: WebSocket `/api/rpc` endpoint accepts connections and executes RPC methods
- **US3**: Pro plan displays and charges $149/month
- **US4**: PDFs auto-delete per plan tier retention periods

**Suggested MVP Scope**: US1 + US2 + US5 (P1 stories) = 33 tasks + infrastructure = ~60 tasks total for MVP

---

## Format Validation

✅ **All tasks follow checklist format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ **Task IDs sequential**: T001 through T091 in execution order
✅ **[P] markers present**: 43 parallelizable tasks identified
✅ **[Story] labels present**: All user story phase tasks labeled (US1, US2, US3, US4, US5)
✅ **File paths included**: All implementation tasks specify exact file paths
✅ **Independent testability**: Each user story has clear independent test criteria
✅ **Dependency clarity**: Phase and story dependencies clearly documented

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Foundational phase (T007-T017) MUST complete before ANY user story work begins
- P1 stories (US1, US2, US5) focus on core performance architecture
- P2 stories (US3, US4) handle configuration fixes, can be deferred if needed
- Performance validation (Phase 8) is MANDATORY before production deployment
- Commit after each task or logical group of parallel tasks
- Stop at any checkpoint to validate story independently
- Feature flag (ENABLE_DURABLE_OBJECTS) enables zero-downtime deployment and rollback
