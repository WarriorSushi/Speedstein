/**
 * API Key Generation Service
 * Phase 4: User Story 2 (T054, T055)
 * Generates API keys in format: sk_[tier]_[32-char-base62]
 * Hashes keys with SHA-256 before storage
 */

import type { SubscriptionTier } from '@speedstein/shared';

/**
 * Base62 character set (alphanumeric, case-sensitive)
 */
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a random base62 string of specified length
 */
function generateBase62String(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62_CHARS[array[i] % BASE62_CHARS.length];
  }

  return result;
}

/**
 * Generate an API key in the format: sk_[tier]_[32-char-base62]
 * @param tier - User's subscription tier (free, starter, pro, enterprise)
 * @returns Full API key string
 */
export function generateApiKey(tier: SubscriptionTier): string {
  const secret = generateBase62String(32);
  return `sk_${tier}_${secret}`;
}

/**
 * Hash an API key using SHA-256
 * @param apiKey - The full API key to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Extract the prefix from an API key (first 8 characters)
 * Used for display purposes and quick lookups
 * @param apiKey - The full API key
 * @returns First 8 characters of the key
 */
export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 8);
}

/**
 * Validate API key format
 * @param apiKey - The API key to validate
 * @returns True if format is valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Format: sk_[tier]_[32-char-base62]
  const pattern = /^sk_(free|starter|pro|enterprise)_[0-9A-Za-z]{32}$/;
  return pattern.test(apiKey);
}

/**
 * Extract tier from API key
 * @param apiKey - The API key
 * @returns Subscription tier or null if invalid
 */
export function getTierFromApiKey(apiKey: string): SubscriptionTier | null {
  if (!isValidApiKeyFormat(apiKey)) {
    return null;
  }

  const parts = apiKey.split('_');
  return parts[1] as SubscriptionTier;
}
