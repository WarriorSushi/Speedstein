# Feature Specification: Architecture Alignment - Durable Objects, Cap'n Web RPC, and Performance Optimization

**Feature Branch**: `002-architecture-alignment`
**Created**: 2025-10-26
**Status**: Draft
**Input**: User description: "Fix critical architecture gaps: implement Durable Objects for browser session pooling, Cap'n Web RPC with promise pipelining, correct pricing tiers, and R2 storage lifecycle policies"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - High-Volume Batch PDF Generation (Priority: P1)

An enterprise customer (e.g., tax software company) needs to generate 500 invoices during end-of-month billing. They connect to Speedstein's WebSocket API and use promise pipelining to submit all 500 PDF generation requests in a single batch. The system processes these requests through warm browser sessions maintained by Durable Objects, achieving 100+ PDFs per minute throughput with consistent sub-2-second generation times per PDF.

**Why this priority**: This is the core architectural enhancement that enables Speedstein to deliver on its "5x faster than competitors" value proposition. Without Durable Objects maintaining warm Chrome instances, the system cannot achieve the promised performance targets or handle high-volume enterprise workloads. This directly impacts competitive positioning and enterprise sales.

**Independent Test**: Can be fully tested by establishing a WebSocket connection, sending a batch of 100 PDF generation requests using Cap'n Web promise pipelining, and measuring throughput (must achieve 100+ PDFs/min) and P95 latency (must be <2s). Delivers immediate value by enabling high-volume batch operations that were previously impossible.

**Acceptance Scenarios**:

1. **Given** an enterprise user has an active WebSocket connection to `/api/rpc`, **When** they submit 100 PDF generation requests using promise pipelining without awaiting each individually, **Then** all 100 PDFs are generated within 60 seconds using warm browser sessions
2. **Given** a user submits a batch PDF generation request, **When** the system processes the batch, **Then** each PDF is generated in under 2 seconds (P95 latency) due to browser session reuse
3. **Given** multiple users are generating PDFs concurrently, **When** the system allocates browser sessions via Durable Objects, **Then** each user gets isolated session pools without cross-contamination
4. **Given** a browser session has been idle for 5 minutes, **When** the Durable Object cleanup mechanism runs, **Then** the idle browser instance is closed to free resources
5. **Given** a user's WebSocket session is active, **When** they send dependent operations (e.g., fetch data → generate PDF), **Then** both operations complete in a single network round trip using promise pipelining

---

### User Story 2 - REST API Performance Improvement (Priority: P1)

A small business developer uses the REST API to generate invoices one at a time. Even though they use the simple REST endpoint (not WebSocket), their requests are internally routed through the Durable Object browser pool, eliminating cold starts. They experience consistent sub-2-second PDF generation times instead of the 3-5 second delays with per-request browser launches.

**Why this priority**: This architectural improvement benefits ALL users, not just WebSocket/enterprise users. Even simple REST API users will see 2-3x performance improvement from session reuse. This is critical for meeting the <2s P95 latency target that is central to Speedstein's value proposition.

**Independent Test**: Can be tested by making sequential REST API calls to `/api/generate` and measuring response times - should consistently achieve <2s P95 latency compared to 3-5s with cold browser launches. Delivers value as improved performance for existing REST API users.

**Acceptance Scenarios**:

1. **Given** a user calls `/api/generate` via REST API, **When** the request is processed, **Then** it is internally routed to a Durable Object with a warm Chrome instance
2. **Given** a user makes multiple sequential PDF generation requests, **When** each request is processed, **Then** they all use browser session reuse and maintain <2s P95 latency
3. **Given** a REST API request arrives and no warm browser is available, **When** the Durable Object initializes a new browser, **Then** subsequent requests from that user reuse the warm instance
4. **Given** a user hasn't made requests for 5 minutes, **When** their next request arrives, **Then** a new browser session is initialized if the previous one was cleaned up
5. **Given** system load is high, **When** multiple users send concurrent requests, **Then** Durable Objects distribute load across browser instances maintaining performance targets

---

### User Story 3 - Correct Pricing Tier Configuration (Priority: P2)

A potential customer reviews Speedstein's pricing page and sees the Pro plan priced at $149/month for 50,000 PDFs. This matches the original business plan and competitive analysis. When they upgrade to the Pro plan via DodoPayments, they are charged the correct $149/month amount and receive the correct 50,000 PDF quota.

**Why this priority**: Pricing consistency is critical for business integrity and financial projections. The current $99 Pro plan pricing in specs contradicts the original technical specification ($149) and could undermine revenue targets. While not as critical as performance architecture, this must be corrected before launch to avoid customer confusion or revenue loss.

**Independent Test**: Can be tested by reviewing pricing page, completing upgrade flow to Pro plan, and verifying charge amount is $149 and quota is 50,000 PDFs. Delivers value as accurate pricing information for customers.

**Acceptance Scenarios**:

1. **Given** a user views the pricing page, **When** they see the Pro plan, **Then** the price displays as $149/month with 50,000 PDFs quota
2. **Given** a user upgrades to the Pro plan, **When** they complete DodoPayments checkout, **Then** they are charged exactly $149.00
3. **Given** a Pro plan user checks their dashboard, **When** they view their subscription details, **Then** their quota shows 50,000 PDFs/month
4. **Given** documentation references Pro plan pricing, **When** developers read the docs, **Then** all references consistently state $149/month

---

### User Story 4 - Automated PDF Storage Cleanup (Priority: P2)

A Free tier user generates a test PDF. The PDF is stored in Cloudflare R2 and is accessible via the returned URL. After 24 hours, the PDF is automatically deleted by R2 lifecycle policies, freeing storage space. A Pro tier user's PDFs are retained for 30 days before deletion. This automated cleanup prevents unbounded storage costs.

**Why this priority**: Without storage lifecycle policies, R2 costs will grow unbounded as PDFs accumulate indefinitely. This is a moderate-priority operational issue that impacts cost control but doesn't block core functionality. It should be implemented before significant usage volume to prevent surprise storage bills.

**Independent Test**: Can be tested by generating PDFs on different plan tiers, waiting for TTL periods to elapse, and verifying PDFs are deleted per plan (24h free, 7d starter, 30d pro, 90d enterprise). Delivers value as automated cost control.

**Acceptance Scenarios**:

1. **Given** a Free tier user generates a PDF, **When** 24 hours elapse, **Then** the PDF is automatically deleted from R2 storage
2. **Given** a Starter tier user generates a PDF, **When** 7 days elapse, **Then** the PDF is automatically deleted from R2 storage
3. **Given** a Pro tier user generates a PDF, **When** 30 days elapse, **Then** the PDF is automatically deleted from R2 storage
4. **Given** an Enterprise tier user generates a PDF, **When** 90 days elapse, **Then** the PDF is automatically deleted from R2 storage
5. **Given** a user downloads a PDF before its TTL expires, **When** they access the URL after TTL, **Then** they receive a 404 error and appropriate message that the PDF has expired per their plan's retention policy

---

### User Story 5 - WebSocket RPC Endpoint Availability (Priority: P1)

A developer reads the Speedstein API documentation and sees WebSocket API examples using Cap'n Web. They establish a WebSocket connection to `wss://api.speedstein.com/api/rpc` and use the Cap'n Web client library to create an RPC session. They can now call `generatePdf()` and `generateBatch()` methods remotely via the RPC interface, experiencing the benefits of persistent connections and promise pipelining.

**Why this priority**: The WebSocket RPC endpoint is a core architectural component that was promised in the original specifications and is currently completely missing. This is advertised in documentation but not implemented, creating a critical gap between promises and reality. This must be implemented to fulfill API contract.

**Independent Test**: Can be tested by establishing WebSocket connection to `/api/rpc`, creating Cap'n Web RpcStub, calling remote methods, and verifying they execute successfully. Delivers value as advanced API interface for power users.

**Acceptance Scenarios**:

1. **Given** a developer has the Cap'n Web client library, **When** they connect to `wss://api.speedstein.com/api/rpc`, **Then** a WebSocket connection is established and upgraded to Cap'n Web RPC protocol
2. **Given** an active RPC session exists, **When** the developer calls `api.generatePdf(html, options)`, **Then** the remote method executes on the server and returns a PdfResult
3. **Given** an active RPC session exists, **When** the developer calls `api.generateBatch(jobs)`, **Then** all jobs are processed with promise pipelining in a single round trip
4. **Given** an active RPC session exists, **When** the developer calls `api.ping()`, **Then** they receive "pong" response confirming the connection is alive
5. **Given** a WebSocket connection is idle for 30 seconds, **When** the heartbeat mechanism runs, **Then** a ping/pong exchange keeps the connection alive
6. **Given** a developer's WebSocket connection drops, **When** they attempt to reconnect, **Then** they can establish a new RPC session and resume operations

---

### Edge Cases

- What happens when all Durable Object browser instances are at capacity? → System queues incoming requests with a maximum wait time of 5 seconds; if capacity isn't available within 5s, return 503 Service Unavailable with retry-after header
- How does system handle Durable Object migrations or restarts? → In-flight PDF generations complete before migration; new requests are routed to new Durable Object instance; browser sessions are re-initialized
- What happens if a browser instance crashes during PDF generation? → Error is caught, browser instance is recycled, request fails with 500 error and user can retry; Durable Object initializes a fresh browser for next request
- What happens when a user downgrades from Pro ($149) to Starter ($29) mid-cycle with >5,000 PDFs already generated? → Downgrade is scheduled for next billing cycle; user retains 50,000 quota until renewal; at renewal, quota drops to 5,000
- How does R2 lifecycle cleanup affect in-flight PDF generations? → PDFs are only deleted after their TTL expires (24h-90d); in-flight generations complete normally; lifecycle rules don't interfere with active operations
- What happens if WebSocket RPC connection drops during a batch operation? → In-progress PDFs complete; partial results are lost; client receives connection closed event and must retry failed jobs; idempotency is not guaranteed
- What happens when promise pipelining fails due to network issues? → Cap'n Web client receives error; partial results may be available; client can retry individual failed operations
- How does system handle rapid WebSocket reconnections from the same user? → Each reconnection creates a new RPC session; old sessions are garbage collected; no limit on reconnection attempts but rate limiting applies to PDF generation
- What happens if R2 storage quota is exceeded? → PDF upload fails with 507 Insufficient Storage; user receives error indicating storage issue; system alerts operators to increase R2 capacity
- How does system handle browser instance memory leaks over time? → Durable Objects recycle browser instances after 1000 PDFs or 1 hour (whichever comes first) to prevent memory accumulation; new instance is initialized transparently

## Requirements *(mandatory)*

### Functional Requirements

#### Durable Objects Browser Session Pooling

- **FR-001**: System MUST implement Cloudflare Durable Objects to maintain stateful browser session pools
- **FR-002**: Each Durable Object MUST maintain 1-5 warm Chrome browser instances depending on load
- **FR-003**: Browser instances MUST be reused across multiple PDF generation requests from the same Durable Object
- **FR-004**: System MUST route incoming PDF requests to appropriate Durable Objects based on user ID or request distribution algorithm
- **FR-005**: Durable Objects MUST automatically initialize new browser instances when pool is empty
- **FR-006**: Durable Objects MUST close idle browser instances after 5 minutes of inactivity to free resources
- **FR-007**: System MUST recycle browser instances after 1000 PDFs or 1 hour (whichever comes first) to prevent memory leaks
- **FR-008**: Durable Objects MUST handle browser instance crashes by recycling the failed instance and initializing a new one
- **FR-009**: System MUST achieve 100+ PDFs per minute throughput per Durable Object using session reuse

#### Cap'n Web RPC Implementation

- **FR-010**: System MUST implement a PdfGeneratorApi class that extends RpcTarget from the Cap'n Web library
- **FR-011**: PdfGeneratorApi MUST expose `generatePdf(html: string, options: PdfOptions)` method returning PdfResult
- **FR-012**: PdfGeneratorApi MUST expose `generateBatch(jobs: PdfJob[])` method returning PdfResult[] with promise pipelining
- **FR-013**: PdfGeneratorApi MUST expose `ping()` method returning "pong" for health checks
- **FR-014**: System MUST expose WebSocket endpoint at `/api/rpc` that accepts Cap'n Web RPC connections
- **FR-015**: WebSocket endpoint MUST use `newWorkersRpcResponse` to handle both HTTP Batch and WebSocket upgrade requests
- **FR-016**: System MUST implement WebSocket heartbeat mechanism with 30-second ping/pong interval
- **FR-017**: System MUST properly dispose RpcTarget resources using Symbol.dispose() or 'using' keyword
- **FR-018**: System MUST handle WebSocket disconnections gracefully and allow clients to reconnect
- **FR-019**: Promise pipelining MUST enable dependent operations (e.g., fetch data → generate PDF) to complete in single round trip

#### REST API Integration with Durable Objects

- **FR-020**: Existing `/api/generate` REST endpoint MUST internally route requests to Durable Object browser pools
- **FR-021**: REST API requests MUST benefit from browser session reuse even without using WebSocket
- **FR-022**: System MUST maintain backward compatibility - existing REST API clients work without changes
- **FR-023**: REST API MUST achieve P95 latency under 2 seconds using session reuse
- **FR-024**: System MUST handle REST API requests and WebSocket requests through the same Durable Object infrastructure

#### Pricing Tier Corrections

- **FR-025**: Pro plan pricing MUST be set to $149/month (not $99/month)
- **FR-026**: Pro plan quota MUST remain 50,000 PDFs/month
- **FR-027**: All pricing documentation, landing pages, and dashboard displays MUST show correct $149 Pro plan pricing
- **FR-028**: DodoPayments integration MUST charge $149.00 for Pro plan subscriptions
- **FR-029**: System MUST validate Pro plan users have 50,000 PDF quota in usage tracking

#### R2 Storage Lifecycle Policies

- **FR-030**: System MUST configure Cloudflare R2 bucket with lifecycle policies for automatic PDF deletion
- **FR-031**: Free tier PDFs MUST be automatically deleted after 24 hours
- **FR-032**: Starter tier PDFs MUST be automatically deleted after 7 days
- **FR-033**: Pro tier PDFs MUST be automatically deleted after 30 days
- **FR-034**: Enterprise tier PDFs MUST be automatically deleted after 90 days
- **FR-035**: System MUST tag each uploaded PDF with the user's plan tier for lifecycle policy application
- **FR-036**: Expired PDF URLs MUST return 404 errors with user-friendly messages indicating retention period
- **FR-037**: System MUST log PDF deletions for auditing and cost tracking purposes

#### Performance & Reliability

- **FR-038**: System MUST achieve P95 latency under 2 seconds for all PDF generation requests
- **FR-039**: System MUST achieve P50 latency under 1.5 seconds for PDF generation
- **FR-040**: System MUST handle 10,000 concurrent PDF generation requests across Durable Objects
- **FR-041**: Durable Objects MUST be deployed across multiple Cloudflare regions for redundancy
- **FR-042**: System MUST implement request queuing with maximum 5-second wait time when Durable Objects are at capacity
- **FR-043**: System MUST return 503 Service Unavailable with Retry-After header when capacity exceeded

### Key Entities

- **DurableObjectBrowserPool**: Represents a stateful browser session pool; attributes include object ID, active browser instances (array), request queue, creation timestamp, last activity timestamp, total PDFs generated
- **BrowserInstance**: Represents a single Chrome browser session; attributes include instance ID, creation timestamp, PDFs generated count, last used timestamp, memory usage estimate, status (active/idle/crashed)
- **RpcSession**: Represents an active Cap'n Web RPC connection; attributes include session ID, user ID, connection start time, last heartbeat timestamp, request count, connection type (HTTP Batch or WebSocket)
- **PdfRetentionPolicy**: Represents storage lifecycle rule; attributes include plan tier (free/starter/pro/enterprise), retention period (24h/7d/30d/90d), R2 lifecycle rule ID
- **PricingTier**: Represents corrected pricing configuration; attributes include tier name (free/starter/pro/enterprise), monthly price ($0/$29/$149/$499), PDF quota (100/5000/50000/500000), retention days (1/7/30/90)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate 100 PDFs per minute through WebSocket API using promise pipelining (measured via load testing with Cap'n Web client)
- **SC-002**: PDF generation achieves P95 latency under 2 seconds for both REST and WebSocket APIs (measured via server-side timing logs)
- **SC-003**: PDF generation achieves P50 latency under 1.5 seconds (measured via percentile analysis of generation times)
- **SC-004**: System successfully processes 10,000 concurrent PDF generation requests without errors (measured via load testing)
- **SC-005**: Durable Objects maintain browser session reuse with average session lifetime of 5+ minutes before idle cleanup (measured via Durable Object metrics)
- **SC-006**: Pro plan users are correctly charged $149/month (verified via DodoPayments webhook events and invoice records)
- **SC-007**: Pro plan users receive 50,000 PDF monthly quota (verified via usage tracking dashboard)
- **SC-008**: Free tier PDFs are automatically deleted after 24 hours (verified by checking R2 storage for PDFs older than 24h on free accounts)
- **SC-009**: Pro tier PDFs are automatically deleted after 30 days (verified by checking R2 storage for PDFs older than 30d on pro accounts)
- **SC-010**: WebSocket RPC endpoint accepts connections and successfully executes remote method calls (verified via integration tests with Cap'n Web client)
- **SC-011**: Promise pipelining reduces round-trip time for dependent operations by 50%+ compared to sequential calls (measured via benchmark comparison)
- **SC-012**: Browser instance recycling prevents memory leaks over 24-hour operation period (measured via Durable Object memory monitoring)
- **SC-013**: System storage costs remain predictable and bounded by automatic cleanup (measured via R2 billing and storage usage trends)
- **SC-014**: 99.9% of users experience consistent sub-2-second generation times (measured via user-facing latency percentiles)

## Assumptions

1. **Cloudflare Durable Objects Availability**: Assuming Cloudflare Durable Objects are available in the account tier and region, support stateful browser instance pooling, and can maintain long-lived Chrome browser processes. **Validation**: Must test Durable Objects can keep Chrome instances alive for 5+ minutes without forced restarts
2. **Durable Object Performance**: Assuming Durable Objects can handle 100+ PDF generations per minute per object without performance degradation. **Validation**: Load test required with sustained 100 PDFs/min for 10 minutes
3. **Cap'n Web Production Readiness**: Assuming Cap'n Web library (capnweb npm package) is stable for production use with WebSocket and HTTP Batch modes. Original spec assumed this is validated - proceeding with implementation
4. **Browser Instance Stability**: Assuming Cloudflare Browser Rendering API Chrome instances can run continuously for 1 hour or 1000 PDFs without memory leaks or crashes requiring more frequent recycling
5. **R2 Lifecycle Policy Support**: Assuming Cloudflare R2 supports lifecycle policies with tag-based rules (e.g., delete objects with tag tier=free after 24 hours). **Validation**: Must verify R2 lifecycle API supports this use case
6. **DodoPayments Pricing Changes**: Assuming DodoPayments allows updating Pro plan price from $99 to $149 without disrupting existing Pro subscribers (grandfather existing, new signups get $149)
7. **Backward Compatibility**: Assuming existing REST API clients (if any exist in testing) will continue to work without modifications when Durable Objects are introduced as internal routing layer
8. **Durable Object Routing**: Assuming user ID-based or round-robin routing to Durable Objects provides sufficient load distribution without requiring sophisticated load balancing algorithms
9. **Storage Cost Projections**: Assuming R2 storage costs with lifecycle cleanup remain under $200/month at target scale (10K users, 1M PDFs/month with varied retention periods)
10. **WebSocket Scaling**: Assuming Cloudflare Workers support sufficient concurrent WebSocket connections (target: 1000 concurrent RPC sessions) without hitting platform limits

## Out of Scope

The following features are explicitly excluded from this specification:

1. **Template Library**: Pre-built PDF templates - not part of architecture alignment work
2. **Multi-Region Durable Object Replication**: Automatic failover between regions - use default Cloudflare Durable Object distribution
3. **Custom Browser Configurations**: User-configurable Chrome flags or browser settings beyond standard PDF options
4. **Advanced Load Balancing**: Sophisticated algorithms for Durable Object selection - use simple user ID hash or round-robin
5. **Historical PDF Analytics**: Detailed analytics about which PDFs were generated, access patterns, etc. - only track quota/usage for billing
6. **PDF Caching**: Intelligent caching of identical HTML → PDF conversions - future optimization
7. **GraphQL API**: Only REST and WebSocket RPC - no GraphQL endpoint
8. **Multi-Tenancy Within Durable Objects**: Each Durable Object serves requests from multiple users (simple pooling) - no advanced isolation per user
9. **Browser Instance Customization**: Users cannot request specific Chrome versions, extensions, or configurations
10. **Grandfathered Pricing**: Existing Pro plan users (if any) remain at $99 - only new signups pay $149 (note: since this is pre-launch, likely no existing users to grandfather)
