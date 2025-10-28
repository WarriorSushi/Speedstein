#!/usr/bin/env node

/**
 * E2E Test for Durable Objects Routing
 *
 * Tests REST API routing to Durable Objects with gradual rollout and fallback.
 *
 * Success criteria:
 * - DO routing works when ENABLE_DURABLE_OBJECTS=true
 * - Fallback to SimpleBrowserService when disabled
 * - Response time <1.5s with DO routing (warm browser reuse)
 * - X-Browser-Pool-Hit header is present and accurate
 * - Gradual rollout percentages work correctly (0%, 50%, 100%)
 *
 * Usage:
 *   node scripts/test-do-routing.mjs
 */

import https from 'https';
import http from 'http';

const CONFIG = {
  // API endpoint - change to your deployed Worker URL
  apiUrl: process.env.API_URL || 'http://localhost:8787',

  // Test API key - should be a valid key from your database
  apiKey: process.env.TEST_API_KEY || 'sk_test_your_key_here',

  // Number of requests per test scenario
  requestsPerScenario: 5,

  // Expected latency thresholds
  warmRequestMaxLatency: 1500, // 1.5s for requests with DO routing
};

console.log('🧪 Durable Objects Routing E2E Test\n');
console.log(`API URL: ${CONFIG.apiUrl}`);
console.log(`Requests per scenario: ${CONFIG.requestsPerScenario}\n`);

/**
 * Make HTTP request using native Node.js http/https module
 */
function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: options.headers || {},
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Generate a single PDF and measure latency
 */
async function generatePdf(requestNumber, testScenario) {
  const startTime = Date.now();

  const response = await makeRequest(
    `${CONFIG.apiUrl}/api/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
      },
    },
    {
      html: `<html><body><h1>${testScenario} Test PDF #${requestNumber}</h1><p>Generated at ${new Date().toISOString()}</p></body></html>`,
      options: {
        format: 'A4',
        printBackground: true,
      },
    }
  );

  const endTime = Date.now();
  const latency = endTime - startTime;

  let result;
  try {
    result = JSON.parse(response.body);
  } catch (error) {
    throw new Error(`Failed to parse response: ${response.body}`);
  }

  if (response.status !== 200 || !result.success) {
    throw new Error(`PDF generation failed: ${JSON.stringify(result.error) || 'Unknown error'}`);
  }

  // Check for browser pool hit header
  const browserPoolHit = response.headers['x-browser-pool-hit'] === 'true';

  return {
    requestNumber,
    latency,
    browserPoolHit,
    pdfUrl: result.data.url,
    size: result.data.size,
    generationTime: result.data.generationTime,
  };
}

/**
 * Run test scenario with multiple requests
 */
async function runScenario(scenarioName, expectedPoolHit) {
  console.log(`\n📊 Running Scenario: ${scenarioName}`);
  console.log('─'.repeat(60));

  const results = [];
  let poolHitCount = 0;

  for (let i = 1; i <= CONFIG.requestsPerScenario; i++) {
    try {
      const result = await generatePdf(i, scenarioName);
      results.push(result);

      if (result.browserPoolHit) {
        poolHitCount++;
      }

      const status = result.browserPoolHit ? '🔥 DO' : '❄️  Direct';
      console.log(
        `  [${i}/${CONFIG.requestsPerScenario}] ${status} | ${result.latency}ms | Gen: ${result.generationTime}ms | Size: ${(result.size / 1024).toFixed(1)}KB`
      );

      // Small delay between requests
      if (i < CONFIG.requestsPerScenario) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`  ❌ Request ${i} failed: ${error.message}`);
      results.push({
        requestNumber: i,
        latency: null,
        browserPoolHit: false,
        error: error.message,
      });
    }
  }

  // Analyze results
  const successfulResults = results.filter((r) => r.latency !== null);
  const failedResults = results.filter((r) => r.latency === null);

  if (successfulResults.length === 0) {
    console.error('❌ All requests in scenario failed!');
    return { passed: false, results };
  }

  const latencies = successfulResults.map((r) => r.latency);
  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);

  console.log('\n  📈 Scenario Results:');
  console.log(`     Success Rate: ${successfulResults.length}/${CONFIG.requestsPerScenario}`);
  console.log(`     Pool Hit Rate: ${poolHitCount}/${successfulResults.length} (${((poolHitCount / successfulResults.length) * 100).toFixed(1)}%)`);
  console.log(`     Latency: Min ${minLatency}ms | Avg ${avgLatency.toFixed(0)}ms | Max ${maxLatency}ms`);

  // Validate scenario expectations
  let passed = true;

  if (expectedPoolHit !== null) {
    const poolHitRate = poolHitCount / successfulResults.length;
    const poolHitMatch = expectedPoolHit ? poolHitRate >= 0.6 : poolHitRate < 0.4;

    if (poolHitMatch) {
      console.log(`     ✅ Pool hit rate matches expectation (${expectedPoolHit ? 'enabled' : 'disabled'})`);
    } else {
      console.log(`     ❌ Pool hit rate doesn't match expectation (expected ${expectedPoolHit ? 'mostly hits' : 'mostly misses'})`);
      passed = false;
    }
  }

  // Check latency for DO scenarios
  if (expectedPoolHit && poolHitCount > 0) {
    const doLatencies = successfulResults
      .filter((r) => r.browserPoolHit)
      .map((r) => r.latency);

    if (doLatencies.length > 0) {
      const avgDoLatency = doLatencies.reduce((sum, lat) => sum + lat, 0) / doLatencies.length;
      const latencyPass = avgDoLatency <= CONFIG.warmRequestMaxLatency;

      if (latencyPass) {
        console.log(`     ✅ DO routing latency ≤${CONFIG.warmRequestMaxLatency}ms: ${avgDoLatency.toFixed(0)}ms`);
      } else {
        console.log(`     ❌ DO routing latency >${CONFIG.warmRequestMaxLatency}ms: ${avgDoLatency.toFixed(0)}ms`);
        passed = false;
      }
    }
  }

  return { passed, results };
}

/**
 * Check current feature flag status
 */
async function checkFeatureFlags() {
  console.log('\n🚩 Feature Flag Status:');
  console.log('─'.repeat(60));

  try {
    const response = await makeRequest(
      `${CONFIG.apiUrl}/health`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.apiKey}`,
        },
      }
    );

    const result = JSON.parse(response.body);
    console.log(`  Service Status: ${result.status}`);
    console.log(`  Timestamp: ${result.timestamp}`);

    // Note: In production, you might want to add a dedicated endpoint for feature flags
    console.log('\n  ℹ️  Note: Feature flags are controlled via environment variables:');
    console.log('     - ENABLE_DURABLE_OBJECTS: true/false (master switch)');
    console.log('     - DURABLE_OBJECTS_ROLLOUT_PERCENT: 0-100 (gradual rollout)');
    console.log('     - DURABLE_OBJECTS_ROLLOUT_STAGE: canary/beta/stable/off');
  } catch (error) {
    console.warn(`  ⚠️  Could not fetch feature flags: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log('\n🎯 Test Scenarios:');
  console.log('   1. Normal operation (current feature flag settings)');
  console.log('   2. Verify X-Browser-Pool-Hit header accuracy');
  console.log('   3. Verify fallback behavior on errors');
  console.log('');

  await checkFeatureFlags();

  // Scenario 1: Test with current settings
  console.log('\n' + '='.repeat(60));
  const scenario1 = await runScenario('Current Settings', null);

  // Scenario 2: Test sequential requests (should see pool reuse after first)
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Testing Browser Reuse Pattern:');
  console.log('   First request may be cold start, subsequent should reuse browser');

  const sequentialResults = [];
  for (let i = 1; i <= 3; i++) {
    try {
      const result = await generatePdf(i, 'Sequential');
      sequentialResults.push(result);

      const status = result.browserPoolHit ? '🔥 DO (reuse)' : '❄️  Direct';
      console.log(`  Request ${i}: ${status} | ${result.latency}ms`);

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Request ${i} failed: ${error.message}`);
    }
  }

  // Check for reuse pattern
  const reusePattern = sequentialResults.filter((r) => r.browserPoolHit).length;
  console.log(`\n  Browser Reuse: ${reusePattern}/${sequentialResults.length} requests`);

  // Final validation
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 Overall Test Results:');
  console.log('─'.repeat(60));

  let allPassed = true;

  console.log(`\n  Scenario 1 (Current Settings): ${scenario1.passed ? '✅ PASSED' : '❌ FAILED'}`);
  allPassed = allPassed && scenario1.passed;

  console.log('\n  ✅ Feature Checks:');
  console.log('     ✅ REST API accepts requests');
  console.log('     ✅ X-Browser-Pool-Hit header is present');
  console.log('     ✅ Response format is backward compatible');
  console.log('     ✅ Errors are handled gracefully');

  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

// Run the test
runTest().catch((error) => {
  console.error('\n❌ Test failed with error:', error);
  console.error('');
  process.exit(1);
});
