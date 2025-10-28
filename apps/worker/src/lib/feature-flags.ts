/**
 * Feature Flags for Gradual Rollout
 *
 * Implements feature flag logic for Durable Objects browser pooling with
 * gradual rollout support (10% → 50% → 100%).
 *
 * @packageDocumentation
 */

import type { Env } from '../types/env';
import { FEATURE_FLAGS } from './constants';

/**
 * Check if Durable Objects browser pooling is enabled
 *
 * Checks both the feature flag and rollout percentage to determine if DO
 * pooling should be used for the current request.
 *
 * @param env - Worker environment bindings
 * @returns true if DO pooling is enabled, false to fallback to SimpleBrowserService
 *
 * @example
 * ```typescript
 * if (isDurableObjectsEnabled(env)) {
 *   // Use Durable Objects browser pooling
 * } else {
 *   // Fallback to SimpleBrowserService
 * }
 * ```
 */
export function isDurableObjectsEnabled(env: Env): boolean {
  // Check environment variable first (overrides default)
  const envFlag = env.ENABLE_DURABLE_OBJECTS;

  if (envFlag !== undefined && envFlag !== '') {
    // Explicit override: 'true', '1', 'yes' → true, otherwise false
    const enabled = envFlag.toLowerCase();
    return enabled === 'true' || enabled === '1' || enabled === 'yes';
  }

  // Default from constants (true for production)
  return FEATURE_FLAGS.useDurableObjectsPooling;
}

/**
 * Check if request should use Durable Objects based on rollout percentage
 *
 * Uses consistent hashing on user ID to ensure same user always gets same decision.
 * This enables gradual rollout: 10% → 50% → 100%.
 *
 * @param env - Worker environment bindings
 * @param userId - User ID for consistent routing
 * @returns true if user should use DO pooling, false for fallback
 *
 * @example
 * ```typescript
 * // Gradual rollout at 50%
 * if (shouldUseDO(env, authContext.userId)) {
 *   // This user gets DO pooling
 * } else {
 *   // This user stays on SimpleBrowserService
 * }
 * ```
 */
export function shouldUseDO(env: Env, userId: string): boolean {
  // First check if DO is enabled at all
  if (!isDurableObjectsEnabled(env)) {
    return false;
  }

  // Get rollout percentage (0-100)
  const rolloutPercent = getRolloutPercentage(env);

  // 100% rollout - everyone gets DO pooling
  if (rolloutPercent === 100) {
    return true;
  }

  // 0% rollout - nobody gets DO pooling
  if (rolloutPercent === 0) {
    return false;
  }

  // Consistent hashing: Same user always gets same decision
  // Use simple hash of user ID modulo 100
  const hash = hashUserId(userId);
  const bucket = hash % 100;

  // User in rollout bucket? (0-9 for 10%, 0-49 for 50%, etc.)
  return bucket < rolloutPercent;
}

/**
 * Get rollout percentage from environment or default
 *
 * @param env - Worker environment bindings
 * @returns Rollout percentage (0-100)
 */
function getRolloutPercentage(env: Env): number {
  const envValue = env.ROLLOUT_PERCENTAGE;

  if (envValue !== undefined && envValue !== '') {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed)) {
      // Clamp to 0-100 range
      return Math.max(0, Math.min(100, parsed));
    }
  }

  // Default: 100% (full rollout)
  return 100;
}

/**
 * Hash user ID to consistent bucket (0-99)
 *
 * Uses simple string hash algorithm for consistent routing.
 * Same user ID always produces same hash.
 *
 * @param userId - User ID to hash
 * @returns Hash value (0 to Number.MAX_SAFE_INTEGER)
 */
function hashUserId(userId: string): number {
  let hash = 0;

  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return absolute value to ensure positive
  return Math.abs(hash);
}

/**
 * Check if RPC endpoint is enabled
 *
 * @param env - Worker environment bindings
 * @returns true if /api/rpc WebSocket endpoint should be exposed
 */
export function isRpcEndpointEnabled(env: Env): boolean {
  const envFlag = env.FEATURE_RPC_ENDPOINT;

  if (envFlag !== undefined && envFlag !== '') {
    const enabled = envFlag.toLowerCase();
    return enabled === 'true' || enabled === '1' || enabled === 'yes';
  }

  // Default from constants
  return FEATURE_FLAGS.rpcEndpointEnabled;
}

/**
 * Check if REST API should route through Durable Objects
 *
 * This is separate from browser pooling - controls whether /api/generate
 * uses DO routing or SimpleBrowserService.
 *
 * @param env - Worker environment bindings
 * @returns true if REST should use DO routing
 */
export function shouldRestUsesDurableObjects(env: Env): boolean {
  const envFlag = env.FEATURE_REST_DO_ROUTING;

  if (envFlag !== undefined && envFlag !== '') {
    const enabled = envFlag.toLowerCase();
    return enabled === 'true' || enabled === '1' || enabled === 'yes';
  }

  // Default from constants (false initially, enable after validation)
  return FEATURE_FLAGS.restApiUsesDurableObjects;
}

/**
 * Get current rollout stage name for logging/monitoring
 *
 * @param env - Worker environment bindings
 * @returns Stage name ('disabled', 'pilot-10', 'beta-50', 'full-100', 'custom-XX')
 */
export function getRolloutStageName(env: Env): string {
  if (!isDurableObjectsEnabled(env)) {
    return 'disabled';
  }

  const percent = getRolloutPercentage(env);

  switch (percent) {
    case 0:
      return 'disabled';
    case 10:
      return 'pilot-10';
    case 50:
      return 'beta-50';
    case 100:
      return 'full-100';
    default:
      return `custom-${percent}`;
  }
}

/**
 * Feature flag decision context for logging
 *
 * Captures all feature flag decisions for a request for debugging/monitoring.
 */
export interface FeatureFlagContext {
  /** User ID for consistent routing */
  userId: string;

  /** Whether DO pooling is globally enabled */
  durableObjectsEnabled: boolean;

  /** Rollout percentage (0-100) */
  rolloutPercentage: number;

  /** Whether this user should use DO */
  shouldUseDurableObjects: boolean;

  /** User's bucket in consistent hash (0-99) */
  userBucket: number;

  /** Rollout stage name */
  rolloutStage: string;
}

/**
 * Get complete feature flag context for a user
 *
 * Useful for structured logging and debugging.
 *
 * @param env - Worker environment bindings
 * @param userId - User ID
 * @returns Feature flag decision context
 *
 * @example
 * ```typescript
 * const flags = getFeatureFlagContext(env, authContext.userId);
 * logger.info('Feature flags', flags);
 * // Logs: { userId: 'user_123', durableObjectsEnabled: true, rolloutPercentage: 50, ... }
 * ```
 */
export function getFeatureFlagContext(env: Env, userId: string): FeatureFlagContext {
  const doEnabled = isDurableObjectsEnabled(env);
  const rolloutPercent = getRolloutPercentage(env);
  const shouldUse = shouldUseDO(env, userId);
  const hash = hashUserId(userId);
  const bucket = hash % 100;
  const stage = getRolloutStageName(env);

  return {
    userId,
    durableObjectsEnabled: doEnabled,
    rolloutPercentage: rolloutPercent,
    shouldUseDurableObjects: shouldUse,
    userBucket: bucket,
    rolloutStage: stage,
  };
}
