/**
 * Integration Test: POST /api/generate error handling
 *
 * Tests error scenarios including:
 * - Payload too large (>10MB HTML)
 * - Malformed HTML
 * - Missing required fields
 * - Invalid content types
 *
 * @group integration
 * @group api
 */

import { describe, it, expect } from 'vitest';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8787';
const TEST_API_KEY = process.env.TEST_API_KEY || 'sk_test_' + 'a'.repeat(64);

// Maximum HTML size: 10MB
const MAX_HTML_SIZE_BYTES = 10 * 1024 * 1024;

describe('POST /api/generate - Error Handling', () => {
  it('should return 413 for HTML exceeding 10MB limit', async () => {
    // Generate HTML that exceeds 10MB
    // Each character is ~1 byte in UTF-8
    const largeContent = 'x'.repeat(MAX_HTML_SIZE_BYTES + 1000); // 10MB + 1KB
    const largeHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Large Document</title></head>
      <body>
        <div>${largeContent}</div>
      </body>
      </html>
    `;

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: largeHtml,
      }),
    });

    // Should return 413 Payload Too Large
    expect(response.status).toBe(413);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'PAYLOAD_TOO_LARGE');
    expect(data.error.message).toMatch(/exceeds maximum/i);
  });

  it('should return 400 for missing HTML field', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing 'html' field
        options: { format: 'A4' },
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(data.error.message).toMatch(/html/i);
  });

  it('should return 400 for empty HTML', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: '', // Empty HTML
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('should return 400 for non-string HTML', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: 12345, // Number instead of string
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('should return 400 for malformed JSON body', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{invalid json}', // Malformed JSON
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should return 415 for unsupported content type', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'text/plain', // Wrong content type
      },
      body: 'plain text body',
    });

    // Should return 415 Unsupported Media Type or 400
    expect([400, 415]).toContain(response.status);

    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should handle malformed HTML gracefully', async () => {
    // Malformed HTML should still generate a PDF (browsers are lenient)
    const malformedHtml = '<html><body><h1>Unclosed tag<body></html>';

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: malformedHtml,
      }),
    });

    // Should succeed - browsers auto-correct malformed HTML
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should return 400 for invalid options format', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: '<html><body>Test</body></html>',
        options: 'invalid_options', // Should be object, not string
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('should return 405 for unsupported HTTP methods', async () => {
    // GET request to POST-only endpoint
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
      },
    });

    expect(response.status).toBe(405); // Method Not Allowed
  });

  it('should handle extremely long HTML tags', async () => {
    // HTML with extremely long attribute values
    const longAttribute = 'x'.repeat(100000); // 100KB attribute
    const htmlWithLongTag = `
      <!DOCTYPE html>
      <html>
      <head><title>Test</title></head>
      <body>
        <div data-test="${longAttribute}">Content</div>
      </body>
      </html>
    `;

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlWithLongTag,
      }),
    });

    // Should succeed as long as total size is under 10MB
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should include requestId in all error responses', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing HTML - will trigger error
        options: {},
      }),
    });

    const data = await response.json();
    expect(data).toHaveProperty('requestId');
    expect(data.requestId).toMatch(/^req_[a-f0-9]+$/);
  });

  it('should return proper CORS headers on error responses', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'https://speedstein.com',
      },
      body: JSON.stringify({
        html: '', // Empty HTML - will fail validation
      }),
    });

    // Verify CORS headers present even on error
    expect(response.headers.has('access-control-allow-origin')).toBe(true);
  });
});
