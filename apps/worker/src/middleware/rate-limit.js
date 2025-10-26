/**
 * Rate Limiting Middleware
 *
 * Implements sliding window rate limiting using Cloudflare KV.
 * Separate from quota enforcement - this prevents abuse/DDoS.
 *
 * @packageDocumentation
 */
import { RateLimitExceededError } from '@speedstein/shared/lib/errors';
/**
 * Rate Limiter
 *
 * Implements sliding window rate limiting with Cloudflare KV.
 */
export class RateLimiter {
    config;
    constructor(config) {
        this.config = {
            ...config,
            keyPrefix: config.keyPrefix || 'ratelimit:',
        };
    }
    /**
     * Check and update rate limit for a key
     *
     * Uses sliding window algorithm with KV atomic operations.
     *
     * @param identifier - Unique identifier for rate limiting (e.g., user ID, IP address)
     * @returns Rate limit result
     *
     * @example
     * ```typescript
     * const limiter = new RateLimiter({
     *   kv: env.KV_NAMESPACE,
     *   maxRequests: 100,
     *   windowSeconds: 60, // 100 requests per minute
     * });
     *
     * const result = await limiter.checkLimit('user_123');
     * if (!result.allowed) {
     *   throw new RateLimitExceededError('Too many requests', result.retryAfter);
     * }
     * ```
     */
    async checkLimit(identifier) {
        const key = `${this.config.keyPrefix}${identifier}`;
        const now = Date.now();
        const windowStart = now - this.config.windowSeconds * 1000;
        const resetTime = Math.ceil(now / 1000) + this.config.windowSeconds;
        try {
            // Get current count from KV
            const currentValue = await this.config.kv.get(key);
            const requests = currentValue ? JSON.parse(currentValue) : [];
            // Filter out requests outside the current window (sliding window)
            const validRequests = requests.filter((timestamp) => timestamp > windowStart);
            // Add current request
            validRequests.push(now);
            // Check if limit is exceeded
            const currentCount = validRequests.length;
            const allowed = currentCount <= this.config.maxRequests;
            const remaining = Math.max(0, this.config.maxRequests - currentCount);
            // Store updated request list in KV
            await this.config.kv.put(key, JSON.stringify(validRequests), {
                expirationTtl: this.config.windowSeconds * 2, // Keep for 2 windows
            });
            // Calculate retry after (seconds until oldest request expires)
            let retryAfter;
            if (!allowed && validRequests.length > 0) {
                const oldestRequest = validRequests[0];
                const oldestExpiry = oldestRequest + this.config.windowSeconds * 1000;
                retryAfter = Math.ceil((oldestExpiry - now) / 1000);
            }
            return {
                allowed,
                currentCount,
                limit: this.config.maxRequests,
                remaining,
                resetTime,
                retryAfter,
            };
        }
        catch (error) {
            // On KV error, allow request (fail open) but log error
            console.error('Rate limit check failed:', error);
            return {
                allowed: true,
                currentCount: 0,
                limit: this.config.maxRequests,
                remaining: this.config.maxRequests,
                resetTime,
            };
        }
    }
    /**
     * Enforce rate limit (throws error if exceeded)
     *
     * @param identifier - Unique identifier for rate limiting
     * @throws RateLimitExceededError if limit is exceeded
     *
     * @example
     * ```typescript
     * await limiter.enforceLimit('user_123');
     * // Throws if rate limit exceeded, otherwise continues
     * ```
     */
    async enforceLimit(identifier) {
        const result = await this.checkLimit(identifier);
        if (!result.allowed) {
            throw new RateLimitExceededError(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`, result.retryAfter);
        }
    }
    /**
     * Get rate limit headers for response
     *
     * Returns standard rate limit headers for API responses.
     *
     * @param result - Rate limit result
     * @returns Headers object
     */
    getRateLimitHeaders(result) {
        return {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
        };
    }
    /**
     * Reset rate limit for an identifier
     *
     * Useful for testing or manual intervention.
     *
     * @param identifier - Unique identifier
     */
    async resetLimit(identifier) {
        const key = `${this.config.keyPrefix}${identifier}`;
        await this.config.kv.delete(key);
    }
}
/**
 * Create rate limiter for demo endpoint
 *
 * Demo endpoint has stricter limits: 10 requests per hour per IP.
 *
 * @param kv - KV namespace binding
 * @returns Configured rate limiter
 */
export function createDemoRateLimiter(kv) {
    return new RateLimiter({
        kv,
        maxRequests: 10,
        windowSeconds: 60 * 60, // 1 hour
        keyPrefix: 'demo:ratelimit:',
    });
}
/**
 * Create rate limiter for authenticated API
 *
 * Authenticated API uses quota instead, but this provides additional DDoS protection.
 *
 * @param kv - KV namespace binding
 * @returns Configured rate limiter
 */
export function createApiRateLimiter(kv) {
    return new RateLimiter({
        kv,
        maxRequests: 1000, // 1000 requests per minute (anti-DDoS)
        windowSeconds: 60,
        keyPrefix: 'api:ratelimit:',
    });
}
