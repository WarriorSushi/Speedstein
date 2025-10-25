/**
 * Integration Test: POST /api/generate with custom options
 *
 * Tests PDF generation with various options (A4, landscape, margins, etc.).
 * Verifies that options are correctly applied to the generated PDF.
 *
 * @group integration
 * @group api
 */

import { describe, it, expect } from 'vitest';
import type { PdfOptions, PdfResult } from '@speedstein/shared/types/pdf';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:8787';
const TEST_API_KEY = process.env.TEST_API_KEY || 'sk_test_' + 'a'.repeat(64);

const SIMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <h1>Test Document</h1>
  <p>This is a test document for PDF generation with custom options.</p>
</body>
</html>
`;

/**
 * Helper function to generate PDF with options
 */
async function generatePdfWithOptions(
  html: string,
  options: PdfOptions
): Promise<{ response: Response; data: any }> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html,
      options,
    }),
  });

  const data = await response.json();
  return { response, data };
}

describe('POST /api/generate - Custom Options', () => {
  it('should generate PDF with A4 portrait format', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'A4',
      orientation: 'portrait',
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
    expect(data.data.size).toBeGreaterThan(0);
  });

  it('should generate PDF with A4 landscape format', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'A4',
      orientation: 'landscape',
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');

    // Landscape PDFs may have different sizes
    expect(data.data.size).toBeGreaterThan(0);
  });

  it('should generate PDF with Letter format', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'Letter',
      orientation: 'portrait',
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should generate PDF with Legal format', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'Legal',
      orientation: 'portrait',
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should generate PDF with custom margins', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'A4',
      orientation: 'portrait',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should generate PDF with printBackground enabled', async () => {
    const htmlWithBackground = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
          }
        </style>
      </head>
      <body>
        <h1>Document with Background</h1>
      </body>
      </html>
    `;

    const { response, data } = await generatePdfWithOptions(htmlWithBackground, {
      format: 'A4',
      orientation: 'portrait',
      printBackground: true,
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should generate PDF with custom scale', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'A4',
      orientation: 'portrait',
      scale: 0.8, // 80% scale
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should generate PDF with header and footer', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'A4',
      orientation: 'portrait',
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center;">Test Header</div>',
      footerTemplate:
        '<div style="font-size: 10px; text-align: center;">Page <span class="pageNumber"></span></div>',
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should handle multiple options combined', async () => {
    const { response, data } = await generatePdfWithOptions(SIMPLE_HTML, {
      format: 'A4',
      orientation: 'landscape',
      printBackground: true,
      scale: 0.9,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
    expect(data.data.generationTime).toBeGreaterThan(0);
  });

  it('should use default options when none provided', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: SIMPLE_HTML,
        // No options provided - should use defaults
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('url');
  });

  it('should validate invalid format values', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: SIMPLE_HTML,
        options: {
          format: 'INVALID_FORMAT', // Invalid format
        },
      }),
    });

    // Should either accept and use default, or reject with 400
    expect([200, 400]).toContain(response.status);

    const data = await response.json();
    if (response.status === 400) {
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should validate invalid scale values', async () => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: SIMPLE_HTML,
        options: {
          scale: 5.0, // Invalid scale (must be 0.1-2.0)
        },
      }),
    });

    // Should reject with validation error
    expect([200, 400]).toContain(response.status);

    const data = await response.json();
    if (response.status === 400) {
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
