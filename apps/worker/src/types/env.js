/**
 * Cloudflare Worker Environment Bindings
 *
 * TypeScript definitions for all environment variables and bindings
 * available in the Cloudflare Worker runtime.
 */
/**
 * Helper function to check if a feature flag is enabled
 *
 * @param env - Worker environment bindings
 * @param flag - Feature flag name
 * @returns true if enabled, false otherwise
 */
export function isFeatureEnabled(env, flag) {
    const value = env[flag];
    if (value === undefined)
        return false;
    if (typeof value !== 'string')
        return false;
    return value.toLowerCase() === 'true' || value === '1';
}
/**
 * Helper function to get rollout percentage
 *
 * @param env - Worker environment bindings
 * @returns Rollout percentage (0-100)
 */
export function getRolloutPercentage(env) {
    const value = env.ROLLOUT_PERCENTAGE;
    if (!value)
        return 100;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed))
        return 100;
    return Math.max(0, Math.min(100, parsed));
}
/**
 * Helper function to check if request should be included in rollout
 *
 * @param env - Worker environment bindings
 * @param userId - User ID for consistent routing
 * @returns true if user should get new feature, false otherwise
 */
export function shouldIncludeInRollout(env, userId) {
    const percentage = getRolloutPercentage(env);
    if (percentage === 100)
        return true;
    if (percentage === 0)
        return false;
    // Consistent hashing: Use user ID to determine inclusion
    // This ensures same user always gets same decision
    const hash = Array.from(userId).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const bucket = Math.abs(hash) % 100;
    return bucket < percentage;
}
