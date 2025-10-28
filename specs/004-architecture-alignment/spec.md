# Feature Specification: Architecture Alignment

**Feature Branch**: `004-architecture-alignment`
**Created**: 2025-10-27
**Status**: Draft
**Input**: User description: "Fix critical architecture gaps: implement Durable Objects for browser session pooling, Cap'n Web RPC with promise pipelining, correct pricing tiers, and R2 storage lifecycle policies"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ultra-Fast PDF Generation with Browser Pooling (Priority: P1)

API users need to generate PDFs at high volume (100+ per minute) with consistently fast response times (<2 seconds P95 latency). Currently, every PDF request launches a new browser instance, adding 300-500ms overhead. This prevents the API from meeting its core performance promise of sub-2-second generation.

**Why this priority**: This is THE core performance differentiator. Without browser session reuse, Speedstein cannot deliver on its primary value proposition of being "5x faster than competitors." Every request currently wastes 25-40% of time just launching browsers. This directly impacts user satisfaction and competitive positioning.

**Independent Test**: Can be fully tested by generating 10 consecutive PDFs from the same API key and measuring: (1) First request includes browser launch time (~2s), (2) Subsequent requests use pooled browsers (<1.5s), (3) Throughput reaches 100+ PDFs/minute when using pooled sessions.

**Acceptance Scenarios**:

1. **Given** API receives first PDF generation request, **When** request is processed, **Then** new browser instance is created, PDF generates in <2s, and browser is retained in pool for reuse
2. **Given** API receives second PDF request within 5 minutes, **When** request is processed, **Then** pooled browser is reused, eliminating launch overhead, and PDF generates in <1.5s
3. **Given** browser pool has 8 warm browsers and new request arrives, **When** all browsers are in use, **Then** system queues request or creates temporary browser, maintaining system stability
4. **Given** pooled browser has been idle for 5 minutes, **When** timeout period expires, **Then** browser is automatically closed to free resources
5. **Given** API generates 100 PDFs in sequence, **When** using browser pool, **Then** average generation time is 1.3s (vs 1.8s without pooling), achieving 450ms savings per request

---

### User Story 2 - Promise Pipelining for Batch Operations (Priority: P1)

API users who generate multiple PDFs (e.g., bulk invoice generation) need to process batches efficiently. Currently, each PDF requires a separate HTTP request with full network round trip (50ms each way). For 10 PDFs, this means 1000ms wasted on network overhead alone. Promise pipelining allows sending all requests in one round trip.

**Why this priority**: Critical for high-volume users (our target Enterprise customers). Without this, batch PDF generation is 3x slower than it could be. This is a key competitive differentiator explicitly promised in the technical specification. Enterprise customers churning 500K PDFs/month need this efficiency.

**Independent Test**: Can be fully tested by: (1) Establishing WebSocket RPC connection, (2) Sending batch of 10 PDF jobs in single call, (3) Verifying all 10 PDFs complete in ~1.1s total (vs ~11s with sequential REST calls), (4) Confirming throughput reaches 100+ PDFs/minute.

**Acceptance Scenarios**:

1. **Given** client establishes WebSocket RPC connection, **When** connection is made, **Then** persistent session is created and heartbeat monitoring begins
2. **Given** active WebSocket session, **When** client submits array of 3 PDF jobs, **Then** all 3 jobs are pipelined in one message and processed concurrently
3. **Given** batch of 10 PDFs requested via RPC, **When** all jobs complete, **Then** total time is <2s (vs ~11s for sequential REST), demonstrating 3x+ performance improvement
4. **Given** WebSocket session active, **When** no activity for 5 minutes, **Then** connection is gracefully closed with cleanup
5. **Given** promise pipelining enabled, **When** dependent calls are made (e.g., get user ID, then generate PDF with that ID), **Then** both calls complete in one round trip

---

### User Story 3 - REST API with Durable Objects Routing (Priority: P2)

Existing API users calling `/api/generate` REST endpoint need transparent performance improvements without changing their integration. Currently, REST endpoint uses SimpleBrowserService with per-request browsers. Routing through Durable Objects makes browser pooling available to REST users automatically.

**Why this priority**: This ensures all users (not just WebSocket users) benefit from browser pooling. It's lower priority than P1 stories because P1 delivers the infrastructure that makes this possible. Can be implemented after browser pooling and RPC are working, as it's essentially routing existing REST calls through the new architecture.

**Independent Test**: Can be fully tested by: (1) Calling existing `/api/generate` endpoint with test HTML, (2) Measuring response time <1.5s (vs ~2s before), (3) Verifying subsequent calls reuse browsers, (4) Confirming no breaking changes to REST API contract.

**Acceptance Scenarios**:

1. **Given** REST API call to `/api/generate`, **When** request includes valid HTML and API key, **Then** request is transparently routed through Durable Object for browser pool access
2. **Given** Durable Objects unavailable (feature flag disabled), **When** REST request arrives, **Then** system gracefully falls back to SimpleBrowserService, maintaining 100% uptime
3. **Given** user makes 5 REST API calls within 1 minute, **When** calls are processed, **Then** same Durable Object instance handles all 5 (browser reuse)
4. **Given** REST response to `/api/generate`, **When** PDF completes, **Then** response format remains unchanged (backward compatible), including pdf_url, size, generationTime fields

---

### User Story 4 - Correct Pricing Tier Quotas (Priority: P2)

Users subscribing to different plans need accurate quota limits enforced. Currently, code has inconsistent quota values (some places show 1000, others 5000, missing Enterprise tier). Correct values per specification: Free=100, Starter=5000, Pro=50000, Enterprise=500000 PDFs/month.

**Why this priority**: Business-critical for monetization but doesn't affect core technical functionality. Can be fixed independently after core performance features. Impacts billing accuracy and prevents revenue leakage, but doesn't block MVP launch if other tiers work correctly.

**Independent Test**: Can be fully tested by: (1) Creating test users on each plan tier, (2) Generating PDFs until quota reached, (3) Verifying quota enforcement triggers at correct limits, (4) Confirming error messages show accurate remaining quotas.

**Acceptance Scenarios**:

1. **Given** Free tier user with 100 PDF quota, **When** user generates 100th PDF, **Then** request succeeds and user sees "0 PDFs remaining" in response
2. **Given** Free tier user at 100 PDF limit, **When** user attempts 101st PDF, **Then** request fails with 402 Payment Required error showing "Monthly quota exceeded. Upgrade to Starter plan for 5,000 PDFs/month."
3. **Given** Starter tier user with 5,000 PDF quota, **When** user generates PDFs, **Then** quota tracking accurately counts toward 5,000 limit
4. **Given** Enterprise tier user subscribed, **When** system checks quota, **Then** Enterprise plan is recognized with 500,000 PDF/month limit (currently missing)
5. **Given** user at 80% of quota, **When** PDF generates successfully, **Then** response includes warning "80% of monthly quota used. 1,000 PDFs remaining."

---

### User Story 5 - Plan-Based Rate Limiting (Priority: P3)

Users on different subscription tiers need appropriate rate limits to ensure fair usage and system stability. Currently, rate limits don't match specification (should be Free=10/min, Starter=50/min, Pro=200/min, Enterprise=1000/min).

**Why this priority**: Important for system stability and preventing abuse, but not blocking for MVP. Can be implemented after quota enforcement is correct. Rate limits protect infrastructure but are less critical than quota accuracy for monetization.

**Independent Test**: Can be fully tested by: (1) Creating test API key for each tier, (2) Sending burst of requests exceeding tier limit, (3) Verifying 429 error at correct threshold, (4) Checking rate limit headers show accurate counts.

**Acceptance Scenarios**:

1. **Given** Free tier API key, **When** user sends 11 requests in 1 minute, **Then** 11th request returns 429 Too Many Requests with "Rate limit: 10 requests/minute"
2. **Given** Pro tier API key, **When** user sends 150 requests in 1 minute, **Then** all requests succeed (under 200/min limit)
3. **Given** any API response, **When** response is sent, **Then** headers include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset showing current status
4. **Given** user hits rate limit, **When** 60 seconds pass, **Then** rate limit counter resets and requests succeed again

---

### User Story 6 - R2 Lifecycle Policies for PDF Retention (Priority: P3)

Users on different plans receive different PDF storage retention periods (Free=24h, Starter=7d, Pro=30d, Enterprise=90d). Currently, no lifecycle policies exist, so all PDFs are stored indefinitely, incurring unnecessary storage costs.

**Why this priority**: Operational efficiency and cost control, but doesn't affect user-facing functionality. Can be configured manually in Cloudflare dashboard after core features work. Prevents cost overruns but isn't blocking for MVP.

**Independent Test**: Can be fully tested by: (1) Generating PDFs with test accounts on each tier, (2) Waiting beyond retention period, (3) Verifying PDFs are automatically deleted at correct times, (4) Confirming PDF URLs return 404 after expiration.

**Acceptance Scenarios**:

1. **Given** Free tier PDF generated, **When** 24 hours pass, **Then** PDF is automatically deleted from R2 storage and URL returns 404 Not Found
2. **Given** Starter tier PDF generated, **When** 7 days pass, **Then** PDF is automatically deleted
3. **Given** Enterprise tier PDF generated, **When** 90 days pass, **Then** PDF is automatically deleted
4. **Given** PDF nearing expiration, **When** PDF metadata is checked, **Then** expiresAt timestamp accurately reflects retention policy for user's plan tier

---

### Edge Cases

- **Concurrency**: What happens when 20 concurrent requests arrive but browser pool has only 8 browsers? System should queue excess requests or use temporary browsers, gracefully degrading rather than failing.
- **Browser crash**: How does system handle when pooled browser crashes mid-generation? System should detect crash, remove from pool, launch replacement, and retry failed request transparently.
- **WebSocket disconnect**: What happens when WebSocket connection drops during batch operation? System should detect disconnect, fail pending operations gracefully with retry-able errors, and clean up Durable Object resources.
- **Quota edge case**: What if user's quota expires mid-generation? Request that started before quota exceeded should complete successfully, next request should fail with quota error.
- **Rate limit burst**: How does system handle burst traffic from Enterprise user (1000/min limit)? System should use token bucket algorithm allowing temporary bursts up to 2000 requests while maintaining average of 1000/min.
- **Browser pool exhaustion**: What happens when all 8 pooled browsers are in use for >5 minutes? System should increase pool size dynamically up to 16 browsers, then queue additional requests.
- **Durable Object migration**: How does system handle when Durable Object is migrated to different datacenter? Browser pool should gracefully drain and rebuild in new location without dropping requests.
- **R2 lifecycle during generation**: What if PDF is being generated but lifecycle policy triggers deletion of temp files? System should use temporary storage separate from lifecycle-managed storage for in-progress generations.

## Requirements *(mandatory)*

### Functional Requirements

**Browser Session Pooling (Durable Objects)**

- **FR-001**: System MUST maintain pool of up to 8 warm Chrome browser instances per Durable Object
- **FR-002**: System MUST route PDF generation requests to appropriate Durable Object based on user ID for session affinity
- **FR-003**: System MUST automatically close idle browsers after 5 minutes of inactivity to conserve resources
- **FR-004**: System MUST prevent browser pool from exceeding 16 instances to maintain system stability
- **FR-005**: System MUST handle browser crash or freeze by removing from pool and launching replacement
- **FR-006**: System MUST track browser usage metrics (reuse count, average session duration) for monitoring

**Cap'n Web RPC & Promise Pipelining**

- **FR-007**: System MUST implement WebSocket RPC endpoint at `/api/rpc` supporting Cap'n Web protocol
- **FR-008**: System MUST support HTTP Batch mode for clients that cannot use WebSocket
- **FR-009**: System MUST implement `generatePdf` and `generateBatch` RPC methods following PdfGeneratorApi interface
- **FR-010**: System MUST pipeline multiple RPC calls in single network round trip when client uses promise pipelining
- **FR-011**: System MUST maintain WebSocket connections with heartbeat/ping messages every 30 seconds
- **FR-012**: System MUST gracefully close WebSocket after 5 minutes of inactivity
- **FR-013**: System MUST handle concurrent batch operations (up to 100 PDF jobs per batch)

**REST API Integration with Durable Objects**

- **FR-014**: System MUST route `/api/generate` REST requests through Durable Objects when feature is enabled
- **FR-015**: System MUST fallback to SimpleBrowserService when Durable Objects unavailable (feature flag)
- **FR-016**: System MUST maintain backward compatibility with existing REST API response format
- **FR-017**: System MUST use same Durable Object instance for all requests from same API key within 5-minute window

**Pricing Tier Quotas**

- **FR-018**: System MUST enforce Free tier quota of 100 PDFs per month
- **FR-019**: System MUST enforce Starter tier quota of 5,000 PDFs per month
- **FR-020**: System MUST enforce Pro tier quota of 50,000 PDFs per month
- **FR-021**: System MUST enforce Enterprise tier quota of 500,000 PDFs per month
- **FR-022**: System MUST return 402 Payment Required error when quota exceeded with accurate remaining count
- **FR-023**: System MUST display quota warnings at 80%, 90%, and 100% usage thresholds

**Rate Limiting by Tier**

- **FR-024**: System MUST enforce Free tier rate limit of 10 requests per minute
- **FR-025**: System MUST enforce Starter tier rate limit of 50 requests per minute
- **FR-026**: System MUST enforce Pro tier rate limit of 200 requests per minute
- **FR-027**: System MUST enforce Enterprise tier rate limit of 1,000 requests per minute
- **FR-028**: System MUST return 429 Too Many Requests with X-RateLimit headers when limit exceeded
- **FR-029**: System MUST allow burst traffic up to 2x rate limit using token bucket algorithm

**R2 Lifecycle Policies**

- **FR-030**: System MUST configure R2 lifecycle to delete Free tier PDFs after 24 hours
- **FR-031**: System MUST configure R2 lifecycle to delete Starter tier PDFs after 7 days
- **FR-032**: System MUST configure R2 lifecycle to delete Pro tier PDFs after 30 days
- **FR-033**: System MUST configure R2 lifecycle to delete Enterprise tier PDFs after 90 days
- **FR-034**: System MUST tag uploaded PDFs with user plan tier for lifecycle policy application
- **FR-035**: PDF URLs MUST return 404 Not Found after retention period expires

### Key Entities

- **BrowserPool (Durable Object)**: Maintains pool of 8 warm Chrome instances, handles FIFO eviction after 5 min idle, tracks browser usage metrics, assigned per user ID for session affinity
- **PdfGeneratorApi (RPC Target)**: Exposes generatePdf and generateBatch methods via Cap'n Web protocol, handles both WebSocket and HTTP Batch modes, manages promise pipelining
- **PlanTier**: Represents subscription level (Free/Starter/Pro/Enterprise) with associated quotas (100/5K/50K/500K PDFs/month) and rate limits (10/50/200/1000 per minute)
- **R2LifecyclePolicy**: Defines retention rules per plan tier (24h/7d/30d/90d), applied via R2 object tagging

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Performance Improvements**

- **SC-001**: PDF generation P50 latency MUST decrease from 1.8s to 1.3s (28% improvement) when using browser pooling
- **SC-002**: PDF generation P95 latency MUST stay under 2.0s target (currently at 2.5s, improving to <2s)
- **SC-003**: Batch generation of 10 PDFs MUST complete in under 2 seconds via RPC (vs 18s sequential REST), demonstrating 9x improvement
- **SC-004**: System MUST sustain throughput of 100+ PDFs per minute using browser pool (vs 30-40/min currently)

**Browser Pool Efficiency**

- **SC-005**: 80% of PDF requests MUST reuse existing pooled browser (vs 0% currently with per-request browsers)
- **SC-006**: Browser launch overhead MUST be eliminated for 80%+ of requests, saving 450ms per PDF
- **SC-007**: Average browser session lifetime MUST be 3-5 minutes before idle eviction

**Promise Pipelining Adoption**

- **SC-008**: Batch operations via RPC MUST process 3+ PDFs with total time <3s (proving single round trip efficiency)
- **SC-009**: WebSocket RPC connections MUST stay active for 5+ minutes during active use

**Quota Accuracy**

- **SC-010**: 100% of quota enforcement checks MUST use correct tier limits (100/5K/50K/500K)
- **SC-011**: Enterprise tier MUST be fully supported and testable (currently missing)
- **SC-012**: Users at quota limit MUST see accurate error messages showing correct upgrade paths

**Rate Limit Accuracy**

- **SC-013**: Rate limit enforcement MUST trigger at correct thresholds for all 4 tiers
- **SC-014**: API responses MUST include accurate X-RateLimit headers showing remaining quota

**Cost Optimization**

- **SC-015**: R2 storage costs MUST decrease by 60%+ through lifecycle policy enforcement (deleting expired PDFs)
- **SC-016**: Free tier PDFs MUST be automatically deleted after 24 hours (0% currently enforced)

### Qualitative Outcomes

- **SC-017**: Existing REST API users experience performance improvements without code changes (transparent upgrade)
- **SC-018**: System maintains 99.9% uptime during architecture transition with graceful fallbacks
- **SC-019**: Monitoring dashboards show clear visibility into browser pool health and reuse rates

## Assumptions

1. **Infrastructure Access**: Project has Cloudflare Workers Paid plan with Durable Objects and Browser Rendering API enabled
2. **Cap'n Web Compatibility**: Cap'n Web library (v0.1.0) is stable and production-ready for WebSocket RPC
3. **Backward Compatibility**: Existing REST API users will not be disrupted - new architecture is additive, not replacing
4. **Database Schema**: Subscription and quota tables already exist with plan_tier field (as confirmed in current implementation)
5. **R2 Bucket Tagging**: Cloudflare R2 supports object tagging for lifecycle policy application
6. **Browser Pool Size**: 8 browsers per Durable Object is sufficient for typical load; can increase to 16 if needed
7. **User ID Consistency**: API requests include consistent user ID for Durable Object routing and session affinity
8. **Idempotency**: PDF generation requests are idempotent - retrying same HTML produces same output
9. **Memory Limits**: Durable Objects have sufficient memory (128MB default) to maintain 8 Chrome browser contexts
10. **Network Latency**: Internal Cloudflare network latency between Worker and Durable Object is <10ms

## Dependencies

- Cloudflare Workers Paid plan subscription (for Durable Objects)
- Cloudflare Browser Rendering API access
- Existing Supabase database schema with subscriptions table
- Existing API key authentication system
- Cap'n Web npm package (capnweb@^0.1.0)
- @cloudflare/puppeteer package (already installed)
- wrangler.toml configuration update for Durable Objects bindings

## Out of Scope

**Explicitly NOT included in this feature:**

- Frontend development (Next.js landing page, Monaco editor) - separate feature
- Payment integration with DodoPayments - separate feature
- Dashboard UI for usage visualization - separate feature
- Webhook support for async PDF generation notifications - future enhancement
- Custom font upload capability - future enhancement
- PDF watermarking - future enhancement
- PDF caching layer - optimization for future release
- Multi-region deployment - initially single-region only
- Auto-scaling browser pools beyond 16 instances per Durable Object - Phase 2 optimization
- Real-time WebSocket notifications for batch job progress - future enhancement

## Risks & Mitigations

### Technical Risks

**Risk 1: Durable Objects Cold Starts**
- **Description**: First request to new Durable Object instance may take 500-1000ms to initialize browser pool
- **Impact**: High - Affects user experience for first PDF in new session
- **Mitigation**: Pre-warm Durable Objects for active users, implement request queuing during warm-up, show progress indicator

**Risk 2: Cap'n Web Protocol Immaturity**
- **Description**: Cap'n Web v0.1.0 may have bugs or breaking changes in future releases
- **Impact**: Medium - Could require significant rework if protocol changes
- **Mitigation**: Pin to specific Cap'n Web version, maintain REST API as fallback, extensive testing before production rollout

**Risk 3: Browser Pool Resource Exhaustion**
- **Description**: 8-browser limit may be insufficient for high-concurrency users (Enterprise tier)
- **Impact**: Medium - Requests may queue or timeout during traffic spikes
- **Mitigation**: Dynamic pool expansion to 16 browsers, request queuing with 30s timeout, monitoring and alerts

**Risk 4: Durable Object Migration During Traffic**
- **Description**: Cloudflare may migrate Durable Objects between datacenters, disrupting browser pool
- **Impact**: Medium - Temporary performance degradation during migration
- **Mitigation**: Graceful draining of old instance, automatic pool rebuild, fallback to SimpleBrowserService during migration

### Operational Risks

**Risk 5: Incorrect Quota Migration**
- **Description**: Existing users may have incorrect quotas in database requiring data migration
- **Impact**: High - Revenue impact if users have higher quotas than paid for
- **Mitigation**: Audit current database, create migration script, notify users of quota corrections 30 days in advance

**Risk 6: R2 Lifecycle Policy Misconfiguration**
- **Description**: Incorrectly configured lifecycle rules could delete PDFs prematurely or not at all
- **Impact**: High - User data loss or excessive storage costs
- **Mitigation**: Test lifecycle policies in preview environment, staged rollout by tier (Free first), monitoring of deletion events

**Risk 7: Rate Limit False Positives**
- **Description**: Token bucket algorithm may incorrectly throttle legitimate burst traffic
- **Impact**: Medium - User frustration, support tickets
- **Mitigation**: Allow 2x burst limit, log all rate limit events for analysis, support override capability

## Success Validation

**Performance Testing**
- Load test with 1000 concurrent requests measuring P50/P95/P99 latency
- Batch operation test with 100 PDFs measuring total time
- Browser pool reuse rate monitoring over 24 hour period

**Functional Testing**
- Test all 4 pricing tiers (Free/Starter/Pro/Enterprise) reach correct quota limits
- Verify rate limits trigger at correct thresholds for all tiers
- Confirm R2 lifecycle deletes PDFs at correct intervals for each tier

**Integration Testing**
- WebSocket RPC connection establishment and heartbeat
- Promise pipelining with batch of 10 PDFs
- REST API backward compatibility (all existing integrations work unchanged)
- Durable Object fallback when feature flag disabled

**Monitoring**
- Browser pool utilization dashboard (browsers in use / total pool size)
- RPC vs REST usage split
- Quota enforcement accuracy (rejections per tier)
- R2 storage cost reduction tracking

**User Acceptance**
- Existing REST API users report faster response times
- Enterprise tier users successfully use WebSocket RPC for batch operations
- Support tickets for quota issues decrease by 80%
