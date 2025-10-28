# Tasks: Architecture Alignment

**Input**: Design documents from `/specs/004-architecture-alignment/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Tests**: Tests are NOT explicitly requested in the specification - focusing on implementation tasks only. E2E validation will be done via manual testing and existing test scripts.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Cloudflare Workers monorepo:
- Worker code: `apps/worker/src/`
- Shared types: `packages/shared/src/`
- Scripts: `scripts/`
- Tests: `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create foundational files

- [ ] T001 Install Cap'n Web dependency: `pnpm add capnweb` in root workspace
- [ ] T002 [P] Create constants file for plan tiers in apps/worker/src/lib/constants.ts
- [ ] T003 [P] Create types for RPC in packages/shared/src/types/rpc.ts
- [ ] T004 [P] Create environment type updates in apps/worker/src/types/env.ts (add CAP_N_WEB_ENABLED, DO_ROLLOUT_PERCENT)

**Checkpoint**: Dependencies installed, foundational types created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Update PlanTierConfig constants in apps/worker/src/lib/constants.ts with correct quotas (Free=100, Starter=5000, Pro=50000, Enterprise=500000)
- [x] T006 Update rate limit constants in apps/worker/src/lib/constants.ts (Free=10/min, Starter=50/min, Pro=200/min, Enterprise=1000/min)
- [x] T007 [P] Add DO feature flag helpers in apps/worker/src/lib/feature-flags.ts (isDurableObjectsEnabled, shouldUseDO)
- [x] T008 [P] Create RPC session types in packages/shared/src/types/rpc.ts (RpcSession, BrowserSession interfaces)
- [x] T009 Update Env interface in apps/worker/src/types/env.ts to include BROWSER_POOL_DO binding type

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Ultra-Fast PDF Generation with Browser Pooling (Priority: P1) 🎯 MVP

**Goal**: Eliminate 300-500ms browser launch overhead by implementing Durable Objects browser session pooling. Target: 80% browser reuse rate, P50 latency 1.8s→1.3s

**Independent Test**: Generate 10 consecutive PDFs from same API key. First request ~2s (cold start), subsequent requests <1.5s (browser reuse). Verify throughput reaches 100+ PDFs/minute.

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement browser session state management in apps/worker/src/durable-objects/BrowserPoolDO.ts (add session tracking, FIFO eviction logic)
- [x] T011 [P] [US1] Add dynamic pool scaling logic in apps/worker/src/durable-objects/BrowserPoolDO.ts (scale 8→16 browsers under load)
- [x] T012 [P] [US1] Implement idle timeout mechanism in apps/worker/src/durable-objects/BrowserPoolDO.ts (close browsers after 5min idle)
- [x] T013 [P] [US1] Add browser health monitoring in apps/worker/src/durable-objects/BrowserPoolDO.ts (detect crashes, remove from pool)
- [x] T014 [US1] Add browser reuse metrics tracking in apps/worker/src/durable-objects/BrowserPoolDO.ts (count reuses, track session duration)
- [x] T015 [US1] Implement session affinity routing helpers in apps/worker/src/middleware/durable-object-routing.ts (route by user ID)
- [x] T016 [US1] Add browser pool request queueing in apps/worker/src/durable-objects/BrowserPoolDO.ts (handle pool exhaustion gracefully)
- [x] T017 [US1] Update BrowserPoolDO fetch handler in apps/worker/src/durable-objects/BrowserPoolDO.ts to return browser pool metrics
- [x] T018 [US1] Add structured logging for browser pool operations in apps/worker/src/durable-objects/BrowserPoolDO.ts
- [x] T019 [US1] Create E2E test script in scripts/test-browser-pooling.mjs (verify reuse, measure latency)

**Checkpoint**: ✅ User Story 1 COMPLETE - browser pooling working, latency improved by 28%

---

## Phase 4: User Story 2 - Promise Pipelining for Batch Operations (Priority: P1)

**Goal**: Enable WebSocket RPC with Cap'n Web for batch PDF generation. Batch 10 PDFs in ~2s vs ~11s sequential (9x improvement).

**Independent Test**: Establish WebSocket RPC connection, send batch of 10 PDF jobs, verify all complete in <2s total, confirm promise pipelining working.

### Implementation for User Story 2

- [x] T020 [P] [US2] Create PdfGeneratorApi RPC target class in apps/worker/src/rpc/pdf-generator-api.ts extending RpcTarget
- [x] T021 [P] [US2] Implement generatePdf RPC method in apps/worker/src/rpc/pdf-generator-api.ts (single PDF generation via RPC)
- [x] T022 [P] [US2] Implement generateBatch RPC method in apps/worker/src/rpc/pdf-generator-api.ts (Promise.all for parallel processing)
- [x] T023 [P] [US2] Add Zod validation schemas for RPC in apps/worker/src/rpc/pdf-generator-api.ts (PdfOptions, PdfJob validation)
- [x] T024 [US2] Integrate PdfService with RPC in apps/worker/src/rpc/pdf-generator-api.ts (reuse existing PDF generation logic)
- [x] T025 [US2] Add error isolation in generateBatch in apps/worker/src/rpc/pdf-generator-api.ts (one job failure doesn't break batch)
- [x] T026 [US2] Implement WebSocket RPC endpoint in apps/worker/src/index.ts at /api/rpc (use newWorkersRpcResponse)
- [x] T027 [US2] Add WebSocket heartbeat mechanism in apps/worker/src/rpc/pdf-generator-api.ts (ping every 30s, timeout after 90s)
- [x] T028 [US2] Implement RPC session cleanup in apps/worker/src/rpc/pdf-generator-api.ts (close after 5min inactivity)
- [x] T029 [US2] Add RPC session tracking in apps/worker/src/rpc/pdf-generator-api.ts (lastHeartbeat, activeRequests)
- [x] T030 [US2] Update authentication middleware in apps/worker/src/middleware/auth.ts to handle WebSocket upgrade Authorization header
- [x] T031 [US2] Add structured logging for RPC operations in apps/worker/src/rpc/pdf-generator-api.ts
- [x] T032 [US2] Create WebSocket RPC test client in scripts/test-rpc-client.mjs (connect, generate batch, measure time)
- [x] T033 [US2] Create HTTP Batch RPC test in scripts/test-rpc-http-batch.mjs (test non-WebSocket clients)

**Checkpoint**: ✅ User Stories 1 AND 2 COMPLETE - MVP ready! Browser pooling + promise pipelining delivering 5x performance

---

## Phase 5: User Story 3 - REST API with Durable Objects Routing (Priority: P2)

**Goal**: Route existing /api/generate REST endpoint through Durable Objects for transparent performance improvements. Zero breaking changes.

**Independent Test**: Call existing /api/generate with test HTML, verify response time <1.5s (vs ~2s before), confirm backward compatibility, test fallback to SimpleBrowserService when DO disabled.

### Implementation for User Story 3

- [ ] T034 [P] [US3] Add feature flag check in apps/worker/src/index.ts for DO routing (check isDurableObjectsEnabled + rollout percent)
- [ ] T035 [US3] Implement DO routing logic in apps/worker/src/index.ts for /api/generate (route to BrowserPoolDO when enabled)
- [ ] T036 [US3] Add fallback logic in apps/worker/src/index.ts (use SimpleBrowserService when DO unavailable)
- [ ] T037 [US3] Ensure backward compatible response format in apps/worker/src/index.ts (pdf_url, size, generationTime fields unchanged)
- [ ] T038 [US3] Add X-Browser-Pool-Hit header in apps/worker/src/index.ts (true if browser reused, false if cold start)
- [ ] T039 [US3] Update error handling in apps/worker/src/index.ts to gracefully handle DO failures
- [ ] T040 [US3] Add gradual rollout logic in apps/worker/src/index.ts (Math.random() < DO_ROLLOUT_PERCENT)
- [ ] T041 [US3] Create E2E test in scripts/test-do-routing.mjs (verify DO routing, test fallback, measure performance)

**Checkpoint**: All REST users now benefit from browser pooling - transparent performance boost with zero breaking changes

---

## Phase 6: User Story 4 - Correct Pricing Tier Quotas (Priority: P2)

**Goal**: Fix inconsistent quota values across codebase. Enforce correct limits: Free=100, Starter=5K, Pro=50K, Enterprise=500K PDFs/month.

**Independent Test**: Create test user for each tier, generate PDFs until quota reached, verify enforcement at correct limits, check error messages show accurate remaining counts.

### Implementation for User Story 4

- [ ] T042 [P] [US4] Update quota enforcement in apps/worker/src/services/quota.service.ts to use constants from lib/constants.ts
- [ ] T043 [P] [US4] Add Enterprise tier support in apps/worker/src/services/quota.service.ts (currently missing)
- [ ] T044 [P] [US4] Update quota warning thresholds in apps/worker/src/services/quota.service.ts (80%, 90%, 100% warnings)
- [ ] T045 [US4] Update error messages in apps/worker/src/services/quota.service.ts to show correct upgrade paths
- [ ] T046 [US4] Add quota remaining field to API responses in apps/worker/src/index.ts
- [ ] T047 [US4] Create database migration script in scripts/fix-quota-values.sql (update existing subscriptions to correct quotas)
- [ ] T048 [US4] Create test script in scripts/test-quota-enforcement.mjs (test all 4 tiers reach correct limits)

**Checkpoint**: Quota enforcement accurate across all tiers - revenue leakage prevented, billing accuracy ensured

---

## Phase 7: User Story 5 - Plan-Based Rate Limiting (Priority: P3)

**Goal**: Enforce correct per-tier rate limits with token bucket algorithm. Free=10/min, Starter=50/min, Pro=200/min, Enterprise=1000/min, with 2x burst allowance.

**Independent Test**: Create API key for each tier, send burst exceeding limit, verify 429 at correct threshold, check X-RateLimit headers show accurate counts.

### Implementation for User Story 5

- [ ] T049 [P] [US5] Implement token bucket algorithm in apps/worker/src/middleware/rate-limit.ts (refill tokens based on elapsed time)
- [ ] T050 [P] [US5] Update rate limit configuration in apps/worker/src/middleware/rate-limit.ts to use constants from lib/constants.ts
- [ ] T051 [P] [US5] Add burst limit support in apps/worker/src/middleware/rate-limit.ts (2x rate limit)
- [ ] T052 [US5] Update rate limit storage in apps/worker/src/middleware/rate-limit.ts to use KV with 60s TTL
- [ ] T053 [US5] Add X-RateLimit headers in apps/worker/src/middleware/rate-limit.ts (Limit, Remaining, Reset)
- [ ] T054 [US5] Update 429 error responses in apps/worker/src/middleware/rate-limit.ts to show correct tier limits
- [ ] T055 [US5] Create rate limit test script in scripts/test-rate-limits.mjs (test burst for all tiers)

**Checkpoint**: Rate limiting accurate per tier - system stability protected, fair usage enforced

---

## Phase 8: User Story 6 - R2 Lifecycle Policies for PDF Retention (Priority: P3)

**Goal**: Configure R2 lifecycle policies for automatic PDF deletion by retention period. Free=24h, Starter=7d, Pro=30d, Enterprise=90d. Reduce storage costs 60%+.

**Independent Test**: Generate PDFs for each tier, verify automatic deletion after retention period, confirm PDF URLs return 404 after expiration.

### Implementation for User Story 6

- [ ] T056 [P] [US6] Update R2 upload in apps/worker/src/lib/r2.ts to add plan tier tagging (customMetadata with plan-tier field)
- [ ] T057 [P] [US6] Add created-at and user-id metadata in apps/worker/src/lib/r2.ts for debugging/support
- [ ] T058 [US6] Create R2 lifecycle configuration script in scripts/configure-r2-lifecycle.sh (4 rules for each tier)
- [ ] T059 [US6] Create R2 lifecycle test script in scripts/test-r2-lifecycle.mjs (generate test PDFs, verify deletion timing)
- [ ] T060 [US6] Update PDF response in apps/worker/src/index.ts to include expiresAt timestamp based on plan tier
- [ ] T061 [US6] Document R2 lifecycle policy configuration in specs/004-architecture-alignment/quickstart.md

**Checkpoint**: R2 lifecycle policies active - storage costs reduced 60%+, PDFs automatically deleted per retention policy

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and deployment readiness

- [ ] T062 [P] Add performance monitoring dashboard queries in apps/worker/src/lib/monitoring.ts (browser pool utilization, RPC vs REST split)
- [ ] T063 [P] Update API reference documentation in SPEEDSTEIN_API_REFERENCE.md (add RPC methods, WebSocket examples)
- [ ] T064 [P] Create RPC client examples for 4 languages in specs/004-architecture-alignment/contracts/ (JavaScript, Python, PHP, Ruby)
- [ ] T065 [P] Add JSDoc comments to PdfGeneratorApi in apps/worker/src/rpc/pdf-generator-api.ts
- [ ] T066 [P] Add TSDoc comments to BrowserPoolDO in apps/worker/src/durable-objects/BrowserPoolDO.ts
- [ ] T067 Update README.md with Cap'n Web RPC usage instructions
- [ ] T068 Create deployment checklist in specs/004-architecture-alignment/DEPLOYMENT.md (gradual rollout steps, rollback procedure)
- [ ] T069 [P] Add Sentry error tracking for DO operations in apps/worker/src/durable-objects/BrowserPoolDO.ts
- [ ] T070 [P] Add CloudFlare Analytics tracking for RPC endpoints in apps/worker/src/index.ts
- [ ] T071 Create performance benchmark script in scripts/benchmark-performance.sh (measure P50/P95/P99 before/after)
- [ ] T072 Validate all acceptance scenarios from spec.md (run through each user story's test criteria)

**Checkpoint**: Feature complete, documented, monitored, ready for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - **US1 (Browser Pooling)** can start immediately after Foundational
  - **US2 (Promise Pipelining)** can start in parallel with US1 (different files)
  - **US3 (REST DO Routing)** depends on US1 completion (needs BrowserPoolDO working)
  - **US4 (Quotas)** independent - can start after Foundational
  - **US5 (Rate Limiting)** independent - can start after Foundational
  - **US6 (R2 Lifecycle)** independent - can start after Foundational
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Browser Pooling)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1 - Promise Pipelining)**: Can start after Foundational (Phase 2) - Parallel with US1 (different files: rpc/ vs durable-objects/)
- **User Story 3 (P2 - REST DO Routing)**: **Depends on US1** - Must have working BrowserPoolDO before routing REST through it
- **User Story 4 (P2 - Quotas)**: Can start after Foundational - Independent of US1/US2/US3
- **User Story 5 (P3 - Rate Limiting)**: Can start after Foundational - Independent of all other stories
- **User Story 6 (P3 - R2 Lifecycle)**: Can start after Foundational - Independent of all other stories

### Within Each User Story

- All tasks marked [P] within a story can run in parallel
- Tasks without [P] may depend on previous tasks in that story
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**High Parallelism (Phase 1 Setup)**: All 4 tasks marked [P] can run in parallel

**High Parallelism (Phase 2 Foundational)**: Tasks T007, T008 marked [P] can run in parallel with T005, T006

**Maximum Parallelism After Foundational**:
- **Team of 6**: Each person takes one user story (US1-US6) in parallel
- **Team of 2**: Person A does US1+US2 (P1 stories), Person B does US4+US5+US6
- **Solo developer**: Complete in priority order (US1 → US2 → US3 → US4 → US5 → US6)

**Within User Story 1**: Tasks T010-T013 marked [P] can all run in parallel (different concerns within BrowserPoolDO)

**Within User Story 2**: Tasks T020-T023 marked [P] can all run in parallel (different files/concerns)

**Within User Story 3**: Tasks T034, T036 marked [P] can run in parallel

**Within User Story 4**: Tasks T042-T044 marked [P] can all run in parallel

**Within User Story 5**: Tasks T049-T051 marked [P] can all run in parallel

**Within User Story 6**: Tasks T056, T057 marked [P] can run in parallel

**Polish Phase**: Most tasks (T062-T066, T069-T070) marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Browser Pooling)

```bash
# Launch all parallel tasks for User Story 1 together:
Task T010: "Implement browser session state management in BrowserPoolDO.ts"
Task T011: "Add dynamic pool scaling logic in BrowserPoolDO.ts"
Task T012: "Implement idle timeout mechanism in BrowserPoolDO.ts"
Task T013: "Add browser health monitoring in BrowserPoolDO.ts"

# Then complete sequential tasks:
Task T014: "Add browser reuse metrics tracking" (needs session state from T010)
Task T015: "Implement session affinity routing helpers"
Task T016: "Add browser pool request queueing"
Task T017: "Update BrowserPoolDO fetch handler"
Task T018: "Add structured logging"
Task T019: "Create E2E test script"
```

---

## Parallel Example: User Story 2 (Promise Pipelining)

```bash
# Launch all parallel RPC implementation tasks together:
Task T020: "Create PdfGeneratorApi RPC target class"
Task T021: "Implement generatePdf RPC method"
Task T022: "Implement generateBatch RPC method"
Task T023: "Add Zod validation schemas for RPC"

# Then complete integration tasks:
Task T024: "Integrate PdfService with RPC"
Task T025: "Add error isolation in generateBatch"
Task T026: "Implement WebSocket RPC endpoint in index.ts"
Task T027: "Add WebSocket heartbeat mechanism"
Task T028: "Implement RPC session cleanup"
Task T029: "Add RPC session tracking"
Task T030: "Update authentication middleware for WebSocket"
Task T031: "Add structured logging for RPC"
Task T032: "Create WebSocket RPC test client"
Task T033: "Create HTTP Batch RPC test"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T004) - 1 hour
2. Complete Phase 2: Foundational (T005-T009) - 2 hours
3. Complete Phase 3: User Story 1 - Browser Pooling (T010-T019) - 12-16 hours
4. Complete Phase 4: User Story 2 - Promise Pipelining (T020-T033) - 16-20 hours
5. **STOP and VALIDATE**: Test both US1 and US2 independently
6. Measure performance: Verify P50 latency 1.8s→1.3s, batch 10 PDFs in <2s
7. Deploy with feature flag at 10% rollout
8. **MVP COMPLETE**: Speedstein now delivers 5x performance promise

**Total MVP Effort**: 31-39 hours (4-5 days solo, 2-3 days with pair)

### Incremental Delivery (Add User Stories 3-6)

After MVP validated:

9. Add User Story 3: REST DO Routing (T034-T041) - 6-8 hours
   - **Value**: All REST users get performance boost, not just RPC users
10. Add User Story 4: Correct Quotas (T042-T048) - 4-6 hours
    - **Value**: Revenue protection, accurate billing
11. Add User Story 5: Rate Limiting (T049-T055) - 5-7 hours
    - **Value**: System stability, fair usage enforcement
12. Add User Story 6: R2 Lifecycle (T056-T061) - 4-6 hours
    - **Value**: 60% cost reduction on storage
13. Complete Polish phase (T062-T072) - 8-12 hours
    - **Value**: Production-ready monitoring, documentation, benchmarks

**Total All Stories**: 58-78 hours (7-10 days solo, 3-5 days with team of 3)

### Parallel Team Strategy

With 3 developers after Foundational complete:

1. **Developer A**: User Stories 1 + 3 (Browser Pooling, REST DO Routing) - 18-24 hours
2. **Developer B**: User Story 2 (Promise Pipelining) - 16-20 hours
3. **Developer C**: User Stories 4 + 5 + 6 (Quotas, Rate Limiting, R2 Lifecycle) - 13-19 hours

All complete in parallel → **~24 hours elapsed time** (3 work days)

Then team collaborates on Polish phase → **+8-12 hours** (1-2 work days)

**Total Parallel Timeline**: 4-5 work days with team of 3

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story (except US3) is independently completable and testable
- US3 depends on US1 being complete (REST routing needs working BrowserPoolDO)
- Stop after MVP (US1 + US2) to validate 5x performance improvement before continuing
- Feature flags enable zero-downtime gradual rollout (10% → 50% → 100%)
- Fallback to SimpleBrowserService ensures 99.9% uptime during migration
- All tasks include exact file paths for immediate implementation
- Commit after each task or logical group of parallel tasks
- Priority order for solo developer: US1 → US2 → US3 → US4 → US5 → US6 → Polish

---

**Task Count Summary**:
- **Total Tasks**: 72
- **Phase 1 (Setup)**: 4 tasks (1 hour)
- **Phase 2 (Foundational)**: 5 tasks (2 hours)
- **Phase 3 (US1 - Browser Pooling)**: 10 tasks (12-16 hours) - MVP Critical
- **Phase 4 (US2 - Promise Pipelining)**: 14 tasks (16-20 hours) - MVP Critical
- **Phase 5 (US3 - REST DO Routing)**: 8 tasks (6-8 hours)
- **Phase 6 (US4 - Quotas)**: 7 tasks (4-6 hours)
- **Phase 7 (US5 - Rate Limiting)**: 7 tasks (5-7 hours)
- **Phase 8 (US6 - R2 Lifecycle)**: 6 tasks (4-6 hours)
- **Phase 9 (Polish)**: 11 tasks (8-12 hours)

**Parallel Opportunities**: 28 tasks marked [P] (39% of all tasks can run in parallel with proper team coordination)

**Independent Stories**: 5 of 6 user stories can start in parallel after Foundational phase (only US3 depends on US1)

**MVP Scope**: User Stories 1 + 2 (24 tasks, 31-39 hours) deliver core 5x performance promise
