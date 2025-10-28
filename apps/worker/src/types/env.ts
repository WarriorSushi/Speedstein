/**
 * Cloudflare Worker Environment Bindings
 *
 * TypeScript definitions for all environment variables and bindings
 * available in the Cloudflare Worker runtime.
 */

/**
 * Environment bindings for Cloudflare Worker
 *
 * These bindings are automatically injected by the Cloudflare Workers runtime
 * and configured in wrangler.toml.
 */
export interface Env {
  // Index signature for Hono compatibility
  [key: string]: any;

  // ============================================================================
  // CLOUDFLARE BINDINGS
  // ============================================================================

  /**
   * KV namespace for rate limiting
   * @binding RATE_LIMIT_KV
   * @configured wrangler.toml: [[kv_namespaces]]
   */
  RATE_LIMIT_KV: KVNamespace;

  /**
   * R2 bucket for PDF storage
   * @binding PDF_STORAGE
   * @configured wrangler.toml: [[r2_buckets]]
   */
  PDF_STORAGE: R2Bucket;

  /**
   * Browser rendering binding (Cloudflare Browser Rendering API)
   * @binding BROWSER
   * @configured wrangler.toml: [browser]
   */
  BROWSER: Fetcher;

  /**
   * Durable Object namespace for browser session pooling
   * @binding BROWSER_POOL_DO
   * @configured wrangler.toml: [[durable_objects.bindings]]
   */
  BROWSER_POOL_DO: DurableObjectNamespace;

  // ============================================================================
  // SUPABASE CONFIGURATION
  // ============================================================================

  /**
   * Supabase project URL
   * @env SUPABASE_URL
   * @example "https://xxxxx.supabase.co"
   */
  SUPABASE_URL: string;

  /**
   * Supabase anonymous key (for public access)
   * @env SUPABASE_ANON_KEY
   * @security public - safe to expose in client-side code
   */
  SUPABASE_ANON_KEY: string;

  /**
   * Supabase service role key (for server-side operations)
   * @env SUPABASE_SERVICE_ROLE_KEY
   * @security secret - bypasses RLS policies, use with caution
   */
  SUPABASE_SERVICE_ROLE_KEY: string;

  // ============================================================================
  // FEATURE FLAGS (OPTIONAL)
  // ============================================================================

  /**
   * Enable Durable Objects browser pooling
   * @env ENABLE_DURABLE_OBJECTS
   * @default "true"
   */
  ENABLE_DURABLE_OBJECTS?: string;

  /**
   * Enable Durable Objects browser pooling (alternative name)
   * @env FEATURE_DURABLE_OBJECTS_POOLING
   * @default "true"
   */
  FEATURE_DURABLE_OBJECTS_POOLING?: string;

  /**
   * Enable RPC endpoint
   * @env FEATURE_RPC_ENDPOINT
   * @default "true"
   */
  FEATURE_RPC_ENDPOINT?: string;

  /**
   * Enable REST API routing through Durable Objects
   * @env FEATURE_REST_DO_ROUTING
   * @default "false"
   */
  FEATURE_REST_DO_ROUTING?: string;

  /**
   * Gradual rollout percentage for new features (0-100)
   * @env ROLLOUT_PERCENTAGE
   * @default "100"
   */
  ROLLOUT_PERCENTAGE?: string;

  // ============================================================================
  // MONITORING & OBSERVABILITY (OPTIONAL)
  // ============================================================================

  /**
   * Sentry DSN for error tracking
   * @env SENTRY_DSN
   * @optional
   */
  SENTRY_DSN?: string;

  /**
   * Environment name (development, staging, production)
   * @env ENVIRONMENT
   * @default "production"
   */
  ENVIRONMENT?: string;

  /**
   * Enable verbose logging
   * @env DEBUG
   * @default "false"
   */
  DEBUG?: string;
}

/**
 * Type alias for Hono context bindings
 * Use this in Hono middleware and routes
 */
export type HonoBindings = { Bindings: Env };

/**
 * Helper function to check if a feature flag is enabled
 *
 * @param env - Worker environment bindings
 * @param flag - Feature flag name
 * @returns true if enabled, false otherwise
 */
export function isFeatureEnabled(env: Env, flag: keyof Env): boolean {
  const value = env[flag];
  if (value === undefined) return false;
  if (typeof value !== 'string') return false;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Helper function to get rollout percentage
 *
 * @param env - Worker environment bindings
 * @returns Rollout percentage (0-100)
 */
export function getRolloutPercentage(env: Env): number {
  const value = env.ROLLOUT_PERCENTAGE;
  if (!value) return 100;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 100;
  return Math.max(0, Math.min(100, parsed));
}

/**
 * Helper function to check if request should be included in rollout
 *
 * @param env - Worker environment bindings
 * @param userId - User ID for consistent routing
 * @returns true if user should get new feature, false otherwise
 */
export function shouldIncludeInRollout(env: Env, userId: string): boolean {
  const percentage = getRolloutPercentage(env);
  if (percentage === 100) return true;
  if (percentage === 0) return false;

  // Consistent hashing: Use user ID to determine inclusion
  // This ensures same user always gets same decision
  const hash = Array.from(userId).reduce(
    (acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0,
    0
  );
  const bucket = Math.abs(hash) % 100;
  return bucket < percentage;
}
