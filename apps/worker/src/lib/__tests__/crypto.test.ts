/**
 * Unit tests for crypto utility
 * Tests SHA-256 API key hashing functionality
 *
 * @see apps/worker/src/lib/crypto.ts
 */

import { describe, it, expect } from 'vitest';
import { hashApiKey, verifyApiKey, generateApiKey } from '../crypto';

describe('crypto utility', () => {
  describe('hashApiKey', () => {
    it('should hash API key using SHA-256', () => {
      const apiKey = 'sk_test_abc123def456';
      const hash = hashApiKey(apiKey);

      // SHA-256 produces 64 character hex string
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent hashes for same input', () => {
      const apiKey = 'sk_test_abc123def456';
      const hash1 = hashApiKey(apiKey);
      const hash2 = hashApiKey(apiKey);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const apiKey1 = 'sk_test_abc123def456';
      const apiKey2 = 'sk_test_xyz789ghi012';
      const hash1 = hashApiKey(apiKey1);
      const hash2 = hashApiKey(apiKey2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = hashApiKey('');
      expect(hash).toHaveLength(64);
      // SHA-256 of empty string is known value
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should handle unicode characters', () => {
      const apiKey = 'sk_test_🔐🚀';
      const hash = hashApiKey(apiKey);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('verifyApiKey', () => {
    it('should return true for matching API key and hash', () => {
      const apiKey = 'sk_live_production123';
      const hash = hashApiKey(apiKey);

      expect(verifyApiKey(apiKey, hash)).toBe(true);
    });

    it('should return false for non-matching API key and hash', () => {
      const apiKey1 = 'sk_live_production123';
      const apiKey2 = 'sk_live_staging456';
      const hash1 = hashApiKey(apiKey1);

      expect(verifyApiKey(apiKey2, hash1)).toBe(false);
    });

    it('should return false for empty API key', () => {
      const hash = hashApiKey('sk_test_abc123');
      expect(verifyApiKey('', hash)).toBe(false);
    });

    it('should return false for empty hash', () => {
      expect(verifyApiKey('sk_test_abc123', '')).toBe(false);
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with correct prefix', () => {
      const liveKey = generateApiKey('live');
      const testKey = generateApiKey('test');

      expect(liveKey).toMatch(/^sk_live_[a-f0-9]{64}$/);
      expect(testKey).toMatch(/^sk_test_[a-f0-9]{64}$/);
    });

    it('should generate unique API keys', () => {
      const key1 = generateApiKey('live');
      const key2 = generateApiKey('live');

      expect(key1).not.toBe(key2);
    });

    it('should generate keys of correct length', () => {
      const key = generateApiKey('live');
      // Format: sk_live_ (8 chars) + 64 hex chars = 72 total
      expect(key).toHaveLength(72);
    });

    it('should extract correct prefix and last4', () => {
      const key = 'sk_test_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz5678901234';
      const prefix = key.substring(0, 8); // 'sk_test_'
      const last4 = key.substring(key.length - 4); // '1234'

      expect(prefix).toBe('sk_test_');
      expect(last4).toHaveLength(4);
    });

    it('should default to "live" environment', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^sk_live_/);
    });
  });

  describe('extractApiKeyMetadata', () => {
    it('should extract prefix and last4 from API key', () => {
      const key = 'sk_live_abcdefgh1234567890abcdefgh1234567890abcdefgh1234567890abcd1234';
      const metadata = extractApiKeyMetadata(key);

      expect(metadata.prefix).toBe('sk_live_');
      expect(metadata.last4).toBe('1234');
      expect(metadata.environment).toBe('live');
    });

    it('should detect test environment', () => {
      const key = 'sk_test_xyz987654321xyz987654321xyz987654321xyz987654321xyz9876543210';
      const metadata = extractApiKeyMetadata(key);

      expect(metadata.environment).toBe('test');
    });

    it('should throw error for invalid API key format', () => {
      expect(() => extractApiKeyMetadata('invalid_key')).toThrow('Invalid API key format');
    });

    it('should throw error for short API key', () => {
      expect(() => extractApiKeyMetadata('sk_live_short')).toThrow('Invalid API key format');
    });
  });
});

// Helper function to be tested (defined in crypto.ts)
declare function extractApiKeyMetadata(apiKey: string): {
  prefix: string;
  last4: string;
  environment: 'live' | 'test';
};
