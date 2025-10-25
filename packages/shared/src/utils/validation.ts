// Validation utility functions

/**
 * Validates if a string is a valid API key format
 * Format: sk_{env}_{random_hex}
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^sk_(live|test)_[a-f0-9]{64}$/.test(key)
}

/**
 * Extracts prefix from API key (first 8 characters)
 */
export function extractApiKeyPrefix(key: string): string {
  return key.substring(0, 8)
}

/**
 * Extracts last 4 characters from API key
 */
export function extractApiKeyLast4(key: string): string {
  return key.slice(-4)
}

/**
 * Validates HTML content size (max 10MB)
 */
export function isValidHtmlSize(html: string): boolean {
  const sizeInBytes = new TextEncoder().encode(html).length
  const maxSizeInBytes = 10 * 1024 * 1024 // 10MB
  return sizeInBytes <= maxSizeInBytes
}
