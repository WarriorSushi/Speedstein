/**
 * Speedstein Platform Constants
 *
 * Centralized configuration for pricing tiers, browser pooling, rate limiting,
 * and R2 lifecycle policies. All values align with SPEEDSTEIN_TECHNICAL_SPEC.md.
 */
// ============================================================================
// PRICING TIER QUOTAS (FR-019 - FR-022)
// ============================================================================
export const TIER_QUOTAS = {
    free: {
        monthlyPdfs: 100,
        requestsPerMinute: 10,
        retentionDays: 1, // 24 hours
    },
    starter: {
        monthlyPdfs: 5_000,
        requestsPerMinute: 50,
        retentionDays: 7,
    },
    pro: {
        monthlyPdfs: 50_000,
        requestsPerMinute: 200,
        retentionDays: 30,
    },
    enterprise: {
        monthlyPdfs: 500_000, // Corrected from 1M to 500K
        requestsPerMinute: 1000,
        retentionDays: 90,
    },
};
// ============================================================================
// BROWSER POOL CONFIGURATION (FR-001 - FR-005)
// ============================================================================
export const BROWSER_POOL_CONFIG = {
    // Pool size: Start at 8, scale to 16 under load
    minPoolSize: 8,
    maxPoolSize: 16,
    // Session timeout: 5 minutes idle
    sessionTimeoutMs: 5 * 60 * 1000,
    // Maximum pool age: 1 hour (then refresh all browsers)
    maxPoolAgeMs: 60 * 60 * 1000,
    // Cleanup interval: Check every 30 seconds
    cleanupIntervalMs: 30 * 1000,
    // WebSocket heartbeat interval: 30 seconds
    heartbeatIntervalMs: 30 * 1000,
    // Browser launch timeout: 10 seconds
    launchTimeoutMs: 10 * 1000,
    // Page timeout for PDF generation: 30 seconds
    pageTimeoutMs: 30 * 1000,
    // Scaling threshold: Scale up when >80% sessions in use
    scaleUpThreshold: 0.8,
    // Scaling threshold: Scale down when <40% sessions in use
    scaleDownThreshold: 0.4,
};
// ============================================================================
// RATE LIMITING CONFIGURATION (FR-023 - FR-027)
// ============================================================================
export const RATE_LIMIT_CONFIG = {
    // Token bucket algorithm with 2x burst allowance
    burstMultiplier: 2,
    // KV TTL: 60 seconds (sliding window)
    kvTtlSeconds: 60,
    // Rate limit headers
    headers: {
        limit: 'X-RateLimit-Limit',
        remaining: 'X-RateLimit-Remaining',
        reset: 'X-RateLimit-Reset',
        retryAfter: 'Retry-After',
    },
};
// ============================================================================
// R2 LIFECYCLE POLICIES (FR-028 - FR-032)
// ============================================================================
export const R2_LIFECYCLE_RULES = {
    free: {
        expirationDays: 1, // 24 hours
        transitionToInfrequentAccess: null, // No IA tier for free
    },
    starter: {
        expirationDays: 7,
        transitionToInfrequentAccess: 3, // Move to IA after 3 days
    },
    pro: {
        expirationDays: 30,
        transitionToInfrequentAccess: 14, // Move to IA after 14 days
    },
    enterprise: {
        expirationDays: 90,
        transitionToInfrequentAccess: 30, // Move to IA after 30 days
    },
};
// ============================================================================
// PERFORMANCE TARGETS (SC-001 - SC-009)
// ============================================================================
export const PERFORMANCE_TARGETS = {
    // Latency targets
    p50LatencyMs: 1300, // 1.3s (28% improvement from 1.8s)
    p95LatencyMs: 2000, // 2.0s (target)
    // Batch performance
    batchSize: 10,
    batchLatencyMs: 2000, // <2s for 10 PDFs (9x improvement from 18s)
    // Throughput
    minThroughputPerMinute: 100, // 100+ PDFs/minute
    // Browser reuse
    targetReuseRate: 0.8, // 80% of requests use pooled browsers
    // Cold start elimination
    maxColdStartRate: 0.05, // <5% of requests trigger browser launch
};
// ============================================================================
// FEATURE FLAGS (FR-014 - FR-015)
// ============================================================================
export const FEATURE_FLAGS = {
    // Gradual rollout percentages
    rolloutStages: [0.1, 0.5, 1.0], // 10% → 50% → 100%
    // Default: Use Durable Objects browser pooling
    useDurableObjectsPooling: true,
    // Fallback: SimpleBrowserService if DO unavailable
    fallbackToSimpleBrowser: true,
    // RPC endpoint enabled
    rpcEndpointEnabled: true,
    // REST API uses Durable Objects routing
    restApiUsesDurableObjects: false, // Enable in Phase 5 (US3)
};
// ============================================================================
// RPC CONFIGURATION (FR-006 - FR-011)
// ============================================================================
export const RPC_CONFIG = {
    // WebSocket endpoint path
    wsPath: '/api/rpc',
    // HTTP Batch endpoint path (same as WebSocket for auto-negotiation)
    httpBatchPath: '/api/rpc',
    // Max batch size for promise pipelining
    maxBatchSize: 10,
    // RPC timeout: 30 seconds
    timeoutMs: 30 * 1000,
    // Keep-alive ping interval: 30 seconds
    pingIntervalMs: 30 * 1000,
};
// ============================================================================
// MONITORING & OBSERVABILITY
// ============================================================================
export const MONITORING_CONFIG = {
    // Metric keys for KV storage
    metricKeys: {
        browserReuseRate: 'metrics:browser_reuse_rate',
        p50Latency: 'metrics:p50_latency',
        p95Latency: 'metrics:p95_latency',
        throughput: 'metrics:throughput_per_minute',
    },
    // Metric aggregation window: 5 minutes
    aggregationWindowMs: 5 * 60 * 1000,
    // Metric TTL in KV: 24 hours
    metricTtlSeconds: 24 * 60 * 60,
};
// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = {
    QUOTA_EXCEEDED: 'Monthly PDF quota exceeded for your plan',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
    BROWSER_POOL_EXHAUSTED: 'All browser sessions are busy. Please try again.',
    INVALID_API_KEY: 'Invalid or missing API key',
    PDF_GENERATION_TIMEOUT: 'PDF generation timed out after 30 seconds',
    BROWSER_LAUNCH_FAILED: 'Failed to launch browser instance',
    WEBSOCKET_UPGRADE_FAILED: 'Failed to upgrade to WebSocket connection',
};
// ============================================================================
// HTTP STATUS CODES
// ============================================================================
export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
