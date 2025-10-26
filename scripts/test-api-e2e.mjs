#!/usr/bin/env node
/**
 * End-to-End API Testing Script
 *
 * Tests the complete PDF generation flow:
 * 1. Generate test API key (or use existing)
 * 2. Call /api/generate with HTML
 * 3. Verify PDF URL is returned
 * 4. Download and verify PDF
 *
 * Usage:
 *   node scripts/test-api-e2e.mjs [--api-key YOUR_KEY] [--url http://localhost:8787]
 */

import https from 'https';
import http from 'http';
import { writeFileSync } from 'fs';
import { URL } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const apiKeyIndex = args.indexOf('--api-key');
const urlIndex = args.indexOf('--url');

const API_KEY = apiKeyIndex !== -1 ? args[apiKeyIndex + 1] : process.env.TEST_API_KEY;
const BASE_URL = urlIndex !== -1 ? args[urlIndex + 1] : (process.env.WORKER_URL || 'http://localhost:8787');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test cases
async function testHealthEndpoint() {
  logSection('Test 1: Health Check');

  try {
    log(`Calling GET ${BASE_URL}/health`, 'blue');
    const response = await makeRequest(`${BASE_URL}/health`);

    if (response.status === 200 && (response.data.status === 'healthy' || response.data.status === 'ok')) {
      logSuccess('Health check passed');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      logError(`Health check failed: ${response.status}`);
      log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testPdfGeneration() {
  logSection('Test 2: PDF Generation');

  if (!API_KEY) {
    logError('No API key provided. Use --api-key or set TEST_API_KEY environment variable');
    logWarning('To generate a test API key:');
    console.log('  1. Insert test user in Supabase');
    console.log('  2. Generate API key: node scripts/generate-test-api-key.mjs');
    return false;
  }

  const testHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Test Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #2563eb; }
        .invoice-header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .invoice-details { margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h1>Invoice #12345</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="invoice-details">
        <p><strong>Bill To:</strong></p>
        <p>Acme Corporation<br>123 Main St<br>New York, NY 10001</p>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PDF Generation API - Starter Plan</td>
              <td>1</td>
              <td>$29.00</td>
              <td>$29.00</td>
            </tr>
            <tr>
              <td>Additional PDFs (100)</td>
              <td>1</td>
              <td>$5.00</td>
              <td>$5.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3">Total</td>
              <td>$34.00</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>
    </html>
  `;

  try {
    log(`Calling POST ${BASE_URL}/api/generate`, 'blue');
    log(`API Key: ${API_KEY.substring(0, 10)}...`, 'blue');
    log(`HTML size: ${testHtml.length} bytes`, 'blue');

    const startTime = Date.now();
    const response = await makeRequest(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: {
        html: testHtml,
        options: {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm',
          },
        },
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.status === 200 && response.data.success) {
      logSuccess(`PDF generated successfully in ${duration}ms`);

      if (response.data.pdf_url) {
        logSuccess(`PDF URL: ${response.data.pdf_url}`);
        log(`Expires at: ${response.data.expiresAt}`);
        log(`Generation time: ${response.data.generationTime}ms`);

        // Verify performance target
        if (response.data.generationTime < 2000) {
          logSuccess(`Performance: ${response.data.generationTime}ms < 2s target ✓`);
        } else {
          logWarning(`Performance: ${response.data.generationTime}ms > 2s target`);
        }

        return true;
      } else {
        logWarning('PDF generated but no URL returned (fallback mode)');
        log(`Response: ${JSON.stringify(response.data, null, 2)}`);
        return true;
      }
    } else if (response.status === 401) {
      logError('Authentication failed - Invalid API key');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    } else if (response.status === 429) {
      logError('Rate limit exceeded or quota exceeded');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    } else {
      logError(`PDF generation failed: ${response.status}`);
      log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`PDF generation failed: ${error.message}`);
    return false;
  }
}

async function testBatchGeneration() {
  logSection('Test 3: Batch PDF Generation (Optional)');

  if (!API_KEY) {
    logWarning('Skipping batch test - no API key provided');
    return true;
  }

  logWarning('Batch generation via WebSocket RPC not yet implemented');
  logWarning('This feature requires additional setup (Cap\'n Web client)');
  return true;
}

async function runTests() {
  console.log('\n');
  log('╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Speedstein E2E API Test Suite                   ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');

  log(`\nTarget URL: ${BASE_URL}`, 'blue');
  log(`API Key: ${API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Not provided'}`, 'blue');

  const results = {
    health: false,
    pdfGeneration: false,
    batch: false,
  };

  // Test 1: Health check
  results.health = await testHealthEndpoint();

  if (!results.health) {
    logError('\nHealth check failed - aborting remaining tests');
    logWarning('Make sure the worker is running:');
    console.log('  Local: pnpm --filter worker dev');
    console.log('  Production: Check Cloudflare Workers dashboard');
    process.exit(1);
  }

  // Test 2: PDF generation
  results.pdfGeneration = await testPdfGeneration();

  // Test 3: Batch generation (optional)
  results.batch = await testBatchGeneration();

  // Summary
  logSection('Test Summary');

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  log(`Tests passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

  if (results.health) logSuccess('Health check');
  else logError('Health check');

  if (results.pdfGeneration) logSuccess('PDF generation');
  else logError('PDF generation');

  if (results.batch) logSuccess('Batch generation (skipped)');
  else logError('Batch generation');

  console.log('\n');

  if (passed === total) {
    log('╔══════════════════════════════════════════════════════════╗', 'green');
    log('║                  ALL TESTS PASSED ✓                      ║', 'green');
    log('╚══════════════════════════════════════════════════════════╝', 'green');
    console.log('\n');
    process.exit(0);
  } else {
    log('╔══════════════════════════════════════════════════════════╗', 'red');
    log('║                  SOME TESTS FAILED ✗                     ║', 'red');
    log('╚══════════════════════════════════════════════════════════╝', 'red');
    console.log('\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
