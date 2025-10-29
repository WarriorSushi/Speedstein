/**
 * PDF Generation E2E Tests
 *
 * Tests for PDF generation API:
 * - Single PDF generation, rate limiting, quota enforcement, error handling
 *
 * Constitution Compliance:
 * - Principle I (Performance): P95 latency <2s
 * - Principle II (Security): Rate limiting enforced
 * - Principle VIII (Testing): API contract validation
 *
 * @packageDocumentation
 */

import { test, expect } from '@playwright/test';

// API endpoint
const API_URL = process.env.API_URL || 'http://localhost:8787';

// Test API key (should be set in environment or generated)
const TEST_API_KEY = process.env.TEST_API_KEY || '';

test.describe('PDF Generation API', () => {
  test('should generate PDF from simple HTML', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: '<html><body><h1>Test PDF</h1><p>Generated via Playwright</p></body></html>',
        options: {
          format: 'A4',
          orientation: 'portrait',
        },
      },
    });

    // Verify response status
    expect(response.status()).toBe(200);

    // Parse response
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toBeTruthy();
    expect(body.data.size).toBeGreaterThan(0);

    // Verify generation time is under 2 seconds (P95 target)
    expect(body.data.generationTime).toBeLessThan(2000);

    // Verify quota information is included
    expect(body.quota).toBeDefined();
    expect(body.quota.limit).toBeGreaterThan(0);
    expect(body.quota.used).toBeGreaterThanOrEqual(0);
  });

  test('should respect rate limiting', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    const requests = [];

    // Send multiple requests rapidly (exceed rate limit)
    for (let i = 0; i < 15; i++) {
      requests.push(
        request.post(`${API_URL}/api/generate`, {
          headers: {
            'Authorization': `Bearer ${TEST_API_KEY}`,
            'Content-Type': 'application/json',
          },
          data: {
            html: `<h1>Rate limit test ${i}</h1>`,
          },
        })
      );
    }

    // Wait for all requests
    const responses = await Promise.all(requests);

    // Count 429 responses (rate limited)
    const rateLimitedCount = responses.filter(r => r.status() === 429).length;

    // At least some requests should be rate limited
    expect(rateLimitedCount).toBeGreaterThan(0);

    // Verify rate limit headers
    const rateLimitedResponse = responses.find(r => r.status() === 429);
    if (rateLimitedResponse) {
      const headers = rateLimitedResponse.headers();
      expect(headers['retry-after']).toBeTruthy();
      expect(headers['x-ratelimit-limit']).toBeTruthy();
      expect(headers['x-ratelimit-remaining']).toBeTruthy();
    }
  });

  test('should return 401 for invalid API key', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': 'Bearer invalid_key_123',
        'Content-Type': 'application/json',
      },
      data: {
        html: '<h1>Test</h1>',
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('should return 400 for invalid HTML', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: '', // Empty HTML
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('should handle PDF options correctly', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: '<html><body style="background: lightblue;"><h1>Custom Options Test</h1></body></html>',
        options: {
          format: 'Letter',
          orientation: 'landscape',
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px',
          },
          printBackground: true,
        },
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toBeTruthy();
  });

  test('should track quota usage', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    // Generate first PDF
    const response1 = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: '<h1>Quota Test 1</h1>',
      },
    });

    const body1 = await response1.json();
    const usedAfterFirst = body1.quota.used;

    // Generate second PDF
    const response2 = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: '<h1>Quota Test 2</h1>',
      },
    });

    const body2 = await response2.json();
    const usedAfterSecond = body2.quota.used;

    // Verify quota increased
    expect(usedAfterSecond).toBe(usedAfterFirst + 1);
  });

  test('should return 429 when quota exceeded', async ({ request }) => {
    // This test would need a user with exhausted quota
    test.skip(true, 'Requires user with exhausted quota');

    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: '<h1>Quota Exceeded Test</h1>',
      },
    });

    expect(response.status()).toBe(429);

    const body = await response.json();
    expect(body.error.code).toBe('QUOTA_EXCEEDED');
    expect(body.error.quota).toBeDefined();
    expect(body.error.resetDate).toBeTruthy();
  });

  test('should include performance metrics in response', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: '<h1>Performance Metrics Test</h1>',
      },
    });

    const body = await response.json();

    // Verify performance headers
    const headers = response.headers();
    expect(headers['x-generation-time']).toBeTruthy();
    expect(headers['x-request-id']).toBeTruthy();

    // Verify body contains performance data
    expect(body.data.generationTime).toBeDefined();
    expect(body.data.size).toBeDefined();
  });
});

test.describe('PDF Generation Demo (No Auth)', () => {
  test('should allow demo PDF generation without API key', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'X-Demo-Request': 'true',
        'Content-Type': 'application/json',
      },
      data: {
        html: '<h1>Demo PDF</h1><p>No authentication required</p>',
      },
    });

    // Should succeed
    expect(response.status()).toBe(200);

    // Verify response is PDF (Content-Type: application/pdf)
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/pdf');
  });

  test('should enforce stricter rate limits for demo requests', async ({ request }) => {
    const requests = [];

    // Send 10 demo requests rapidly
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.post(`${API_URL}/api/generate`, {
          headers: {
            'X-Demo-Request': 'true',
            'Content-Type': 'application/json',
          },
          data: {
            html: `<h1>Demo Rate Limit Test ${i}</h1>`,
          },
        })
      );
    }

    const responses = await Promise.all(requests);

    // At least some should be rate limited (demo limit: 5 per minute)
    const rateLimitedCount = responses.filter(r => r.status() === 429).length;
    expect(rateLimitedCount).toBeGreaterThan(0);
  });
});

test.describe('PDF Generation Error Handling', () => {
  test('should handle malformed JSON', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: 'invalid json {{{',
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
  });

  test('should handle missing Authorization header', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        html: '<h1>Test</h1>',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should handle large HTML payloads', async ({ request }) => {
    test.skip(!TEST_API_KEY, 'Requires TEST_API_KEY environment variable');

    // Generate 1MB of HTML
    const largeHtml = '<html><body>' + '<p>Large content test</p>'.repeat(10000) + '</body></html>';

    const response = await request.post(`${API_URL}/api/generate`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        html: largeHtml,
      },
      timeout: 30000, // 30 second timeout for large payload
    });

    // Should either succeed or return 413 (payload too large)
    expect([200, 413]).toContain(response.status());
  });
});
