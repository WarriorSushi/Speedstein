/**
 * Integration Test: POST /api/generate with valid HTML
 *
 * Tests the complete PDF generation flow with valid HTML input.
 * Verifies authentication, PDF generation, R2 upload, and response format.
 *
 * @group integration
 * @group api
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { PdfResult } from '@speedstein/shared/types/pdf';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8787';
const TEST_API_KEY = process.env.TEST_API_KEY || 'sk_test_' + 'a'.repeat(64);

// Test HTML content
const VALID_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Invoice</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
    }
    h1 {
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <h1>Invoice #12345</h1>
  <p>Date: 2025-10-26</p>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Widget A</td>
        <td>2</td>
        <td>$50.00</td>
      </tr>
      <tr>
        <td>Widget B</td>
        <td>1</td>
        <td>$75.00</td>
      </tr>
    </tbody>
  </table>
  <p><strong>Total: $175.00</strong></p>
</body>
</html>
`;

describe('POST /api/generate - Valid HTML', () => {
  let generatedPdfUrl: string | null = null;

  it('should generate PDF successfully with valid HTML', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: VALID_HTML,
      }),
    });

    // Verify response status
    expect(response.status).toBe(200);

    // Parse response
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('requestId');

    // Verify PDF result data
    const pdfResult = data.data as PdfResult;
    expect(pdfResult).toHaveProperty('url');
    expect(pdfResult).toHaveProperty('size');
    expect(pdfResult).toHaveProperty('generationTime');
    expect(pdfResult).toHaveProperty('expiresAt');

    // Verify URL format
    expect(pdfResult.url).toMatch(/^https:\/\/cdn\.speedstein\.com\/pdfs\/.+\.pdf$/);

    // Verify PDF size is reasonable (should be > 0)
    expect(pdfResult.size).toBeGreaterThan(0);

    // Verify generation time is reasonable (< 5 seconds for test)
    expect(pdfResult.generationTime).toBeGreaterThan(0);
    expect(pdfResult.generationTime).toBeLessThan(5000);

    // Verify expiration date is valid ISO 8601
    expect(() => new Date(pdfResult.expiresAt)).not.toThrow();
    const expiryDate = new Date(pdfResult.expiresAt);
    const now = new Date();
    expect(expiryDate.getTime()).toBeGreaterThan(now.getTime());

    // Store URL for cleanup
    generatedPdfUrl = pdfResult.url;
  });

  it('should include rate limit headers in response', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: VALID_HTML,
      }),
    });

    expect(response.status).toBe(200);

    // Verify rate limit headers
    expect(response.headers.has('x-ratelimit-limit')).toBe(true);
    expect(response.headers.has('x-ratelimit-remaining')).toBe(true);
    expect(response.headers.has('x-ratelimit-reset')).toBe(true);

    const limit = parseInt(response.headers.get('x-ratelimit-limit') || '0');
    const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '0');

    expect(limit).toBeGreaterThan(0);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(limit);
  });

  it('should generate different PDFs for different HTML content', async () => {
    const html1 = '<html><body><h1>Document 1</h1></body></html>';
    const html2 = '<html><body><h1>Document 2</h1></body></html>';

    // Generate first PDF
    const response1 = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html: html1 }),
    });

    const data1 = await response1.json();
    const url1 = data1.data.url;

    // Generate second PDF
    const response2 = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html: html2 }),
    });

    const data2 = await response2.json();
    const url2 = data2.data.url;

    // Verify different URLs (different PDFs)
    expect(url1).not.toBe(url2);
  });

  it('should return 401 for missing API key', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: VALID_HTML,
      }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('should return 401 for invalid API key format', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: VALID_HTML,
      }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  // Cleanup: Note - R2 files will auto-expire after 30 days
  afterAll(() => {
    if (generatedPdfUrl) {
      console.log(`Generated PDF URL: ${generatedPdfUrl}`);
      console.log('PDF will auto-expire after 30 days');
    }
  });
});
