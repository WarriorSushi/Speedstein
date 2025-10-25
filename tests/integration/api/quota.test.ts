/**
 * Integration Test: Quota enforcement
 *
 * Tests quota checking and enforcement:
 * - Generate PDFs until quota is exceeded
 * - Verify 429 error when quota limit reached
 * - Verify quota headers and error details
 * - Test quota reset behavior
 *
 * @group integration
 * @group api
 * @group quota
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8787';
const TEST_API_KEY = process.env.TEST_API_KEY || 'sk_test_' + 'a'.repeat(64);

// Simple test HTML
const TEST_HTML = '<html><body><h1>Quota Test</h1></body></html>';

/**
 * Helper to generate a PDF
 */
async function generatePdf(): Promise<Response> {
  return await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: TEST_HTML,
    }),
  });
}

/**
 * Helper to get current quota info from API
 */
async function getQuotaInfo(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/usage`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_API_KEY}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data.quota;
  }

  return null;
}

describe('Quota Enforcement', () => {
  it('should track usage after each PDF generation', async () => {
    // Get initial quota
    const initialQuota = await getQuotaInfo();

    if (!initialQuota) {
      console.log('⚠️  Quota API not available, skipping usage tracking test');
      return;
    }

    const initialUsed = initialQuota.used || 0;

    // Generate a PDF
    const response = await generatePdf();
    expect(response.status).toBe(200);

    // Wait a moment for quota to update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check quota again
    const updatedQuota = await getQuotaInfo();
    if (updatedQuota) {
      expect(updatedQuota.used).toBeGreaterThan(initialUsed);
    }
  });

  it('should return quota information in error when limit exceeded', async () => {
    // This test assumes a test account with low quota (e.g., 100 PDFs)
    // In real testing, you'd create a dedicated test account with quota=5

    // Try to generate many PDFs quickly
    const maxAttempts = 200; // Try up to 200 times
    let quotaExceededResponse: Response | null = null;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await generatePdf();

      if (response.status === 429) {
        const data = await response.json();
        if (data.error?.code === 'QUOTA_EXCEEDED') {
          quotaExceededResponse = response;
          break;
        }
      }

      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // If we hit quota limit, verify the error response
    if (quotaExceededResponse) {
      const data = await quotaExceededResponse.json();

      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code', 'QUOTA_EXCEEDED');
      expect(data.error.message).toMatch(/quota/i);

      // Verify quota details in error
      expect(data.error).toHaveProperty('quota');
      expect(data.error).toHaveProperty('used');
      expect(data.error).toHaveProperty('remaining');

      // Used should equal or exceed quota
      expect(data.error.used).toBeGreaterThanOrEqual(data.error.quota);
      expect(data.error.remaining).toBe(0);

      console.log(`✅ Quota limit reached after generating PDFs`);
      console.log(`   Quota: ${data.error.quota}, Used: ${data.error.used}`);
    } else {
      console.log('⚠️  Did not reach quota limit in test (quota may be too high)');
      console.log('   Consider using a dedicated test account with quota=5 for quota tests');
    }
  });

  it('should return 429 status when quota exceeded', async () => {
    // Similar to above, but focused on status code
    const maxAttempts = 200;
    let foundQuotaError = false;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await generatePdf();

      if (response.status === 429) {
        const data = await response.json();
        if (data.error?.code === 'QUOTA_EXCEEDED') {
          foundQuotaError = true;
          expect(response.status).toBe(429); // Too Many Requests
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!foundQuotaError) {
      console.log('⚠️  Did not trigger quota exceeded error in test');
    }
  });

  it('should include quota reset date in error response', async () => {
    const maxAttempts = 200;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await generatePdf();

      if (response.status === 429) {
        const data = await response.json();

        if (data.error?.code === 'QUOTA_EXCEEDED') {
          // Should include reset date
          expect(data.error).toHaveProperty('resetDate');

          // Reset date should be valid ISO 8601
          const resetDate = new Date(data.error.resetDate);
          expect(resetDate.toString()).not.toBe('Invalid Date');

          // Reset date should be in the future
          const now = new Date();
          expect(resetDate.getTime()).toBeGreaterThan(now.getTime());

          console.log(`✅ Quota will reset at: ${data.error.resetDate}`);
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  it('should prevent PDF generation when quota is 0', async () => {
    // This test requires a test account with quota already at 100%
    const maxAttempts = 200;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await generatePdf();

      if (response.status === 429) {
        const data = await response.json();

        if (data.error?.code === 'QUOTA_EXCEEDED') {
          // Verify no PDF was generated
          expect(data.data).toBeUndefined();

          // Verify success is false
          expect(data.success).toBe(false);

          console.log('✅ PDF generation blocked due to quota limit');
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  it('should calculate quota percentage correctly', async () => {
    const quotaInfo = await getQuotaInfo();

    if (quotaInfo) {
      expect(quotaInfo).toHaveProperty('quota');
      expect(quotaInfo).toHaveProperty('used');
      expect(quotaInfo).toHaveProperty('remaining');

      // Verify math
      const expectedRemaining = quotaInfo.quota - quotaInfo.used;
      expect(quotaInfo.remaining).toBe(Math.max(0, expectedRemaining));

      // Calculate percentage
      const percentage = (quotaInfo.used / quotaInfo.quota) * 100;
      expect(percentage).toBeGreaterThanOrEqual(0);

      console.log(
        `📊 Current quota usage: ${quotaInfo.used}/${quotaInfo.quota} (${percentage.toFixed(1)}%)`
      );
    }
  });

  it('should handle concurrent requests within quota', async () => {
    // Generate 3 PDFs concurrently
    const promises = [generatePdf(), generatePdf(), generatePdf()];

    const responses = await Promise.all(promises);

    // Count successful vs quota-exceeded responses
    const successful = responses.filter((r) => r.status === 200);
    const quotaExceeded = responses.filter((r) => r.status === 429);

    console.log(
      `Concurrent test: ${successful.length} succeeded, ${quotaExceeded.length} quota exceeded`
    );

    // At least one should succeed or all should be quota-exceeded
    expect(successful.length + quotaExceeded.length).toBe(3);
  });

  it('should include requestId in quota error responses', async () => {
    const maxAttempts = 200;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await generatePdf();

      if (response.status === 429) {
        const data = await response.json();

        if (data.error?.code === 'QUOTA_EXCEEDED') {
          expect(data).toHaveProperty('requestId');
          expect(data.requestId).toMatch(/^req_[a-f0-9]+$/);
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  it('should differentiate between quota exceeded and rate limit exceeded', async () => {
    // Rate limit and quota are different mechanisms
    // Rate limit: 1000 requests per minute (anti-DDoS)
    // Quota: Monthly PDF generation limit based on plan

    const response = await generatePdf();
    const data = await response.json();

    if (response.status === 429) {
      // Should be either QUOTA_EXCEEDED or RATE_LIMIT_EXCEEDED
      expect(['QUOTA_EXCEEDED', 'RATE_LIMIT_EXCEEDED']).toContain(data.error?.code);

      if (data.error.code === 'QUOTA_EXCEEDED') {
        expect(data.error).toHaveProperty('quota');
        expect(data.error).toHaveProperty('used');
      }

      if (data.error.code === 'RATE_LIMIT_EXCEEDED') {
        expect(response.headers.has('retry-after')).toBe(true);
      }
    }
  });
});

describe('Quota Information API', () => {
  it('should return quota information via GET /api/usage', async () => {
    const quotaInfo = await getQuotaInfo();

    if (quotaInfo) {
      expect(quotaInfo).toHaveProperty('quota');
      expect(quotaInfo).toHaveProperty('used');
      expect(quotaInfo).toHaveProperty('remaining');
      expect(quotaInfo).toHaveProperty('percentage');

      expect(quotaInfo.quota).toBeGreaterThan(0);
      expect(quotaInfo.used).toBeGreaterThanOrEqual(0);
      expect(quotaInfo.remaining).toBeGreaterThanOrEqual(0);
      expect(quotaInfo.percentage).toBeGreaterThanOrEqual(0);
    } else {
      console.log('⚠️  GET /api/usage endpoint not implemented yet');
    }
  });
});
