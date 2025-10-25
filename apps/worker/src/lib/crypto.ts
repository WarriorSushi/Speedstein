/**
 * Cryptographic utilities for API key management
 *
 * Provides SHA-256 hashing for API keys and secure key generation.
 * All API keys are hashed before storage - plaintext keys are NEVER stored.
 *
 * @packageDocumentation
 */

/**
 * Hash an API key using SHA-256
 *
 * This function hashes API keys before storing them in the database.
 * The hash is used for authentication lookups without exposing plaintext keys.
 *
 * @param apiKey - The plaintext API key to hash
 * @returns SHA-256 hash as hexadecimal string (64 characters)
 *
 * @example
 * ```typescript
 * const hash = hashApiKey('sk_live_abc123def456');
 * // Returns: 'a1b2c3d4e5f6...' (64 character hex string)
 * ```
 */
export function hashApiKey(apiKey: string): string {
  // Use Web Crypto API (available in Cloudflare Workers)
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);

  // Create SHA-256 hash
  const hashBuffer = crypto.subtle.digestSync('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Verify an API key against its hash
 *
 * Used during authentication to check if the provided API key matches the stored hash.
 *
 * @param apiKey - The plaintext API key to verify
 * @param hash - The stored SHA-256 hash
 * @returns true if the key matches the hash, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = verifyApiKey('sk_live_abc123', storedHash);
 * if (isValid) {
 *   // Authentication successful
 * }
 * ```
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  if (!apiKey || !hash) {
    return false;
  }

  const computedHash = hashApiKey(apiKey);
  return computedHash === hash;
}

/**
 * Generate a new API key
 *
 * Creates a cryptographically secure random API key with the format:
 * - Live: `sk_live_{64 hex chars}`
 * - Test: `sk_test_{64 hex chars}`
 *
 * @param environment - The environment ('live' or 'test')
 * @returns A new API key string
 *
 * @example
 * ```typescript
 * const liveKey = generateApiKey('live');
 * // Returns: 'sk_live_a1b2c3d4e5f6...'
 *
 * const testKey = generateApiKey('test');
 * // Returns: 'sk_test_x9y8z7w6v5u4...'
 * ```
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  // Generate 32 random bytes (256 bits)
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  // Convert to hex string (64 characters)
  const randomHex = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  // Construct API key with environment prefix
  const prefix = environment === 'live' ? 'sk_live_' : 'sk_test_';
  return prefix + randomHex;
}

/**
 * Extract metadata from an API key
 *
 * Parses an API key to extract its prefix, last 4 characters, and environment.
 * This metadata is safe to display in the dashboard (never show full key).
 *
 * @param apiKey - The full API key
 * @returns Metadata object with prefix, last4, and environment
 * @throws Error if API key format is invalid
 *
 * @example
 * ```typescript
 * const metadata = extractApiKeyMetadata('sk_live_abc123...xyz789');
 * // Returns: {
 * //   prefix: 'sk_live_',
 * //   last4: '9789',
 * //   environment: 'live'
 * // }
 * ```
 */
export function extractApiKeyMetadata(apiKey: string): {
  prefix: string;
  last4: string;
  environment: 'live' | 'test';
} {
  // Validate API key format
  const livePattern = /^sk_live_[a-f0-9]{64}$/;
  const testPattern = /^sk_test_[a-f0-9]{64}$/;

  if (!livePattern.test(apiKey) && !testPattern.test(apiKey)) {
    throw new Error('Invalid API key format');
  }

  // Extract components
  const prefix = apiKey.substring(0, 8); // 'sk_live_' or 'sk_test_'
  const last4 = apiKey.substring(apiKey.length - 4); // Last 4 characters
  const environment = apiKey.startsWith('sk_live_') ? 'live' : 'test';

  return {
    prefix,
    last4,
    environment,
  };
}

/**
 * Generate a secure random request ID
 *
 * Creates a unique identifier for tracking requests across logs and systems.
 * Format: `req_{32 hex chars}`
 *
 * @returns A unique request ID
 *
 * @example
 * ```typescript
 * const requestId = generateRequestId();
 * // Returns: 'req_a1b2c3d4e5f6...'
 * ```
 */
export function generateRequestId(): string {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  const randomHex = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `req_${randomHex}`;
}

/**
 * Hash HTML content for deduplication
 *
 * Creates a SHA-256 hash of HTML content to detect duplicate PDF generation requests.
 * This enables caching and prevents redundant PDF generation.
 *
 * @param html - The HTML content to hash
 * @returns SHA-256 hash as hexadecimal string
 *
 * @example
 * ```typescript
 * const hash = hashHtmlContent('<html><body>Invoice</body></html>');
 * // Can be used to check if this exact HTML was generated before
 * ```
 */
export function hashHtmlContent(html: string): string {
  return hashApiKey(html); // Reuse the same SHA-256 hashing logic
}

/**
 * Constant-time string comparison
 *
 * Prevents timing attacks when comparing sensitive strings like API keys.
 * Uses bitwise operations to ensure constant-time execution.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 *
 * @internal
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
