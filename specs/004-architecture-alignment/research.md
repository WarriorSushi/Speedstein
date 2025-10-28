# Architecture Alignment Research

**Feature**: Architecture Alignment (004)
**Date**: 2025-10-27
**Research Phase**: Phase 0 - Technical Investigation

## Decision Log

### D1: Cap'n Web Integration Architecture

- **Decision**: Use Cap'n Web's `newWorkersRpcResponse` helper for automatic WebSocket/HTTP Batch handling
- **Rationale**:
  - Single code path handles both WebSocket upgrades and HTTP Batch requests
  - Automatic protocol negotiation reduces boilerplate
  - Cloudflare Workers natively support WebSocket API
  - Cap'n Web v0.1.0 provides TypeScript-first API
- **Alternatives Considered**:
  - **Manual WebSocket handling**: Rejected - too complex, error-prone, reinvents wheel
  - **HTTP-only RPC**: Rejected - loses promise pipelining benefits, no persistent connections
  - **gRPC-Web**: Rejected - heavier protocol, less optimal for edge compute
- **Implementation Notes**:
  ```typescript
  // In index.ts fetch handler
  if (pathname === '/api/rpc') {
    const api = new PdfGeneratorApi(env, logger);
    return newWorkersRpcResponse(request, api);
  }
  ```
  - `newWorkersRpcResponse` automatically:
    - Detects `Upgrade: websocket` header → establishes WebSocket
    - Handles HTTP POST with Cap'n Proto body → HTTP Batch mode
    - Serializes/deserializes messages
    - Manages session lifecycle

### D2: Durable Objects Migration Strategy

- **Decision**: Implement feature flag with gradual rollout (0% → 10% → 50% → 100%)
- **Rationale**:
  - Zero-downtime migration critical for 99.9% uptime target
  - Gradual rollout allows monitoring browser pool health
  - Automatic rollback if P95 latency exceeds 2.5s threshold
  - Existing SimpleBrowserService provides proven fallback
- **Alternatives Considered**:
  - **Big bang migration**: Rejected - too risky, no rollback path
  - **Canary deployment**: Considered - similar to feature flag but more complex infrastructure
  - **Blue-green deployment**: Rejected - requires duplicate infrastructure, higher cost
- **Implementation Notes**:
  ```typescript
  // Feature flag in .dev.vars / wrangler secrets
  DURABLE_OBJECTS_ENABLED=true
  DURABLE_OBJECTS_ROLLOUT_PERCENT=10  // Start at 10%

  // In index.ts
  const useDO = isDurableObjectsEnabled(env) &&
                Math.random() * 100 < env.DO_ROLLOUT_PERCENT;

  if (useDO) {
    // Route through BrowserPoolDO
  } else {
    // Fallback to SimpleBrowserService
  }
  ```
  - Rollout schedule:
    - Week 1: 10% traffic → monitor P95 latency, error rate
    - Week 2: 50% traffic → verify browser reuse metrics
    - Week 3: 100% traffic → full migration complete
  - Rollback trigger: P95 > 2.5s or error rate > 0.5%

### D3: Browser Pool Sizing & Performance

- **Decision**: Start with 8 browsers per DO, scale dynamically to 16 under load
- **Rationale**:
  - Chrome browser context ~8-12MB memory each
  - Durable Objects default 128MB memory → supports 10-16 contexts safely
  - 8 browsers handle ~480 requests/min (1 PDF/s per browser at 1s avg)
  - Dynamic scaling to 16 handles burst traffic (Enterprise tier 1000/min)
- **Alternatives Considered**:
  - **Fixed 4 browsers**: Rejected - insufficient for Pro/Enterprise tiers (200-1000/min)
  - **Fixed 16 browsers**: Rejected - wastes memory during low traffic, higher cold start
  - **Unlimited pool**: Rejected - memory exhaustion risk, DO restart
- **Implementation Notes**:
  - Pool configuration:
    ```typescript
    const BROWSER_POOL_CONFIG = {
      minSize: 8,           // Always maintain 8 warm browsers
      maxSize: 16,          // Scale up to 16 under load
      idleTimeout: 5 * 60 * 1000,  // 5 minutes
      maxAge: 60 * 60 * 1000,      // 1 hour max lifetime
    };
    ```
  - Dynamic scaling logic:
    - If all 8 browsers busy for >10s → launch 4 more (total 12)
    - If all 12 browsers busy for >10s → launch 4 more (total 16)
    - If >5 browsers idle for >2min → evict down to 8
  - Memory monitoring: Track `performance.memory.usedJSHeapSize` before launch

### D4: R2 Lifecycle Policy Configuration

- **Decision**: Use R2 lifecycle rules with object metadata tagging for tier-based expiration
- **Rationale**:
  - R2 lifecycle rules support automatic deletion by age and tag filters
  - Object metadata allows per-file tier tagging without separate manifest
  - Cloudflare R2 REST API supports lifecycle rule CRUD operations
  - No manual cron jobs needed - R2 handles expiration automatically
- **Alternatives Considered**:
  - **Manual deletion cron**: Rejected - requires Worker cron trigger, complex, error-prone
  - **TTL in KV index**: Rejected - requires maintaining separate index, out-of-sync risk
  - **CloudFlare Cache API**: Rejected - not designed for long-term storage, no lifecycle rules
- **Implementation Notes**:
  - Tagging strategy:
    ```typescript
    // When uploading PDF to R2
    await env.PDF_STORAGE.put(fileName, pdfBuffer, {
      customMetadata: {
        'plan-tier': authContext.planTier,  // 'free' | 'starter' | 'pro' | 'enterprise'
        'user-id': authContext.userId,
        'created-at': new Date().toISOString(),
      },
    });
    ```
  - Lifecycle rules (configured via Cloudflare dashboard or API):
    ```yaml
    - filter:
        tag:
          plan-tier: free
      expiration:
        days: 1
    - filter:
        tag:
          plan-tier: starter
      expiration:
        days: 7
    - filter:
        tag:
          plan-tier: pro
      expiration:
        days: 30
    - filter:
        tag:
          plan-tier: enterprise
      expiration:
        days: 90
    ```
  - Script for configuration: `scripts/configure-r2-lifecycle.sh`
  - Verification: Generate test PDFs for each tier, verify deletion after period

### D5: Promise Pipelining Implementation

- **Decision**: Implement `generateBatch` using `Promise.all` with Cap'n Web RpcPromise
- **Rationale**:
  - Cap'n Web automatically pipelines concurrent RPC calls in single message
  - `Promise.all` provides natural parallel execution semantics
  - Each PDF job fails independently without blocking others
  - Client receives all results in one response (no streaming)
- **Alternatives Considered**:
  - **Sequential processing**: Rejected - defeats promise pipelining purpose, slow
  - **Streaming results**: Considered - more complex, requires chunked transfer encoding
  - **Queue-based**: Rejected - introduces latency, requires additional infrastructure
- **Implementation Notes**:
  ```typescript
  // apps/worker/src/rpc/pdf-generator-api.ts
  export class PdfGeneratorApi extends RpcTarget {
    async generateBatch(jobs: PdfJob[]): Promise<PdfResult[]> {
      // Validate batch size
      if (jobs.length > 100) {
        throw new Error('Batch size limited to 100 jobs');
      }

      // Process all jobs in parallel - Cap'n Web pipelines automatically
      const results = await Promise.all(
        jobs.map(async (job) => {
          try {
            return await this.generatePdf(job.html, job.options);
          } catch (error) {
            // Isolate failures - one job failure doesn't break batch
            return {
              success: false,
              error: error.message,
              metadata: job.metadata,
            };
          }
        })
      );

      return results;
    }
  }
  ```
  - Promise pipelining effect:
    - Without pipelining: N jobs × (50ms RTT + 1s PDF gen) = N × 1.05s
    - With pipelining: 50ms RTT + (N × 1s concurrent) = 50ms + 1s for any N
    - 10 PDFs: 10.5s → 1.05s (10x faster)
  - Error isolation: Each job wrapped in try-catch, partial success allowed

### D6: WebSocket Heartbeat & Timeout

- **Decision**: 30-second heartbeat interval, 90-second idle timeout, 5-minute inactivity close
- **Rationale**:
  - Cloudflare Workers WebSocket has no explicit timeout (stays open indefinitely)
  - 30s heartbeat prevents proxy/NAT timeout (typically 60-120s)
  - 90s idle = 3 missed heartbeats before declaring dead
  - 5min inactivity = balance between persistent connection and resource cleanup
- **Alternatives Considered**:
  - **10s heartbeat**: Rejected - too chatty, wastes bandwidth
  - **60s heartbeat**: Considered - acceptable, chose 30s for faster failure detection
  - **No heartbeat**: Rejected - connection hangs undetected, resource leak
- **Implementation Notes**:
  ```typescript
  // In BrowserPoolDO or RPC session handler
  class RpcSession {
    private lastHeartbeat: number = Date.now();
    private heartbeatInterval: number;

    constructor() {
      // Send ping every 30 seconds
      this.heartbeatInterval = setInterval(() => {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }, 30_000);
    }

    onMessage(message: any) {
      if (message.type === 'pong') {
        this.lastHeartbeat = Date.now();
      }
    }

    checkTimeout() {
      const idleTime = Date.now() - this.lastHeartbeat;

      // 90s idle = connection dead
      if (idleTime > 90_000) {
        this.websocket.close(1000, 'Heartbeat timeout');
        clearInterval(this.heartbeatInterval);
      }

      // 5min inactivity = close gracefully
      if (idleTime > 5 * 60_000) {
        this.websocket.close(1000, 'Inactivity timeout');
        clearInterval(this.heartbeatInterval);
      }
    }
  }
  ```
  - Timeout checker runs every 30s via `setInterval`
  - Graceful close (code 1000) allows client to reconnect
  - Cleanup on close: clear intervals, release browser sessions

### D7: Token Bucket Rate Limiting

- **Decision**: Implement token bucket in Cloudflare KV with atomic increment + TTL
- **Rationale**:
  - Token bucket allows burst traffic (2x rate limit) while enforcing average
  - KV atomic increment prevents race conditions
  - TTL auto-expires buckets after window (no manual cleanup)
  - Simple algorithm: tokens += rate/minute every second, max = burst limit
- **Alternatives Considered**:
  - **Fixed window**: Rejected - allows burst at window boundary (2x rate in 1 second)
  - **Sliding window**: Considered - more accurate but complex, requires log of timestamps
  - **Leaky bucket**: Rejected - smoother but less user-friendly (blocks bursty workloads)
- **Implementation Notes**:
  ```typescript
  // apps/worker/src/middleware/rate-limit.ts
  interface TokenBucket {
    tokens: number;        // Current available tokens
    lastRefill: number;    // Timestamp of last refill
    rateLimit: number;     // Tokens per minute
    burstLimit: number;    // Max tokens (2x rateLimit)
  }

  async function checkRateLimit(
    kv: KVNamespace,
    apiKeyId: string,
    tierConfig: PlanTierConfig
  ): Promise<boolean> {
    const key = `rate-limit:${apiKeyId}`;
    const now = Date.now();

    // Get current bucket (or initialize)
    let bucket: TokenBucket = await kv.get(key, { type: 'json' }) || {
      tokens: tierConfig.burstLimit,
      lastRefill: now,
      rateLimit: tierConfig.rateLimit,
      burstLimit: tierConfig.rateLimit * 2,
    };

    // Refill tokens based on time elapsed
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(elapsed * (bucket.rateLimit / 60)); // rate per second
    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, bucket.burstLimit);
    bucket.lastRefill = now;

    // Check if request allowed
    if (bucket.tokens < 1) {
      return false; // Rate limited
    }

    // Consume token
    bucket.tokens -= 1;

    // Save bucket with 60s TTL (auto-expire after inactivity)
    await kv.put(key, JSON.stringify(bucket), { expirationTtl: 60 });

    return true; // Request allowed
  }
  ```
  - Example: Pro tier (200/min, 400 burst)
    - Initial: 400 tokens
    - Request rate 300/min: tokens refill at 200/min, depletes at 100/min
    - After 4 min: tokens = 0, rate limited
    - After 1 min idle: tokens = 200, accepts burst again
  - Headers: Return `X-RateLimit-Remaining: ${bucket.tokens}` in response

### D8: Quota Enforcement Race Conditions

- **Decision**: Use Supabase `increment_usage()` stored procedure for atomic increment
- **Rationale**:
  - Supabase stored procedures execute atomically (ACID transactions)
  - Single database round trip prevents race window
  - Optimistic locking avoids read-write-update races
  - Already implemented in current codebase (`increment_usage` function)
- **Alternatives Considered**:
  - **Application-level locking**: Rejected - requires distributed lock (Redis), complex
  - **Optimistic update with retry**: Considered - more database round trips, eventual consistency
  - **Pessimistic locking**: Rejected - deadlock risk, performance impact
- **Implementation Notes**:
  ```sql
  -- Existing Supabase function (already implemented)
  CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    UPDATE usage_quotas
    SET current_usage = current_usage + 1
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO usage_quotas (user_id, plan_quota, current_usage, period_start, period_end)
      VALUES (
        p_user_id,
        100,
        1,
        DATE_TRUNC('month', NOW()),
        DATE_TRUNC('month', NOW() + INTERVAL '1 month')
      );
    END IF;
  END;
  $$;
  ```
  - Usage in Worker:
    ```typescript
    // After successful PDF generation
    await supabase.rpc('increment_usage', { p_user_id: authContext.userId });
    ```
  - Race condition prevented:
    - 2 concurrent requests both read `current_usage = 99`
    - Without atomic increment: Both write `current_usage = 100` (quota under-counted)
    - With stored proc: Serializes to `current_usage = 100`, then `101` (correct)
  - Quota check happens **before** PDF generation (fail fast)
  - Usage increment happens **after** PDF generation (accurate billing)

## Best Practices Summary

### Cap'n Web RPC

**Key Patterns**:
- Always extend `RpcTarget` for server-side API classes
- Use `newWorkersRpcResponse` for automatic protocol handling
- Return `Promise<T>` from RPC methods (Cap'n Web handles serialization)
- Client uses `newWebSocketRpcSession` for persistent connections

**Common Pitfalls to Avoid**:
- Don't manually handle WebSocket protocol - use Cap'n Web helpers
- Don't forget to dispose RPC sessions (memory leak)
- Don't block event loop in RPC methods (use async/await everywhere)
- Don't return non-serializable types (functions, circular refs)

**Performance Optimizations**:
- Batch related operations in single RPC call (`generateBatch` vs multiple `generatePdf`)
- Use WebSocket for repeated calls (avoid HTTP handshake overhead)
- Keep sessions alive with heartbeat (avoid reconnection cost)
- Pipeline dependent calls: `Promise.all([call1(), call2()])` executes in parallel

### Durable Objects

**Session Affinity Patterns**:
- Route by user ID: `env.BROWSER_POOL.idFromName(userId)`
- Consistent hashing distributes load evenly
- Same user always hits same DO (browser reuse)
- DO migration handled by Cloudflare (graceful drain/rebuild)

**Memory Management**:
- Monitor `performance.memory.usedJSHeapSize`
- Evict idle browsers after 5min (FIFO)
- Cap pool at 16 browsers (128MB / 8MB per browser)
- Track browser request count (replace after 100 uses)

**Migration Strategies**:
- Feature flag for gradual rollout
- Monitor P95 latency as rollout indicator
- Automatic rollback if latency degrades
- Fallback to SimpleBrowserService on DO failure

### R2 Lifecycle

**Tagging Conventions**:
- Use `customMetadata` not HTTP headers (persisted with object)
- Tag format: `plan-tier: free|starter|pro|enterprise`
- Include `created-at` for manual verification
- Include `user-id` for support/debugging

**Policy Configuration**:
- Configure via Cloudflare dashboard R2 → Lifecycle rules
- Test with short expiration (1 hour) before production (24h/7d/30d/90d)
- Monitor deletion metrics in Cloudflare analytics
- Alert if storage cost doesn't decrease after policy active

**Testing Approaches**:
- Generate test PDFs for each tier
- Fast-forward system time to expiration (not possible, use short TTL in test)
- Verify 404 response after expiration
- Check R2 object count decreases over time

## Implementation References

### Official Documentation
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare R2 Lifecycle](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [Cap'n Web GitHub](https://github.com/cloudflare/capnweb)
- [Cloudflare Workers WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

### Example Code Repositories
- [Cap'n Web Examples](https://github.com/cloudflare/capnweb/tree/main/examples)
- [Workers RPC Template](https://github.com/cloudflare/workers-sdk/tree/main/templates/worker-durable-objects-rpc)

### Performance Benchmarks
- Chrome browser context memory: 8-12MB (varies by page complexity)
- Puppeteer PDF generation: 800-1500ms (A4, simple HTML)
- Cloudflare DO cold start: 100-300ms (first request to new DO)
- WebSocket handshake: 50-100ms (includes TLS negotiation)
- R2 upload: 50-150ms (50KB PDF, single region)

---

**Research Complete**: All 8 technical questions resolved. Ready for Phase 1 design implementation.
