#!/usr/bin/env node

/**
 * E2E Test for Browser Pooling
 *
 * Tests Durable Objects browser pool reuse and measures latency improvements.
 *
 * Success criteria:
 * - First request ~2s (cold start with browser launch)
 * - Subsequent requests <1.5s (browser reuse)
 * - Browser reuse rate ≥80% after 10 requests
 * - Throughput ≥100 PDFs/minute
 *
 * Usage:
 *   node scripts/test-browser-pooling.mjs
 */

import https from 'https';
import http from 'http';

const CONFIG = {
  // API endpoint - change to your deployed Worker URL
  apiUrl: process.env.API_URL || 'http://localhost:8787',

  // Test API key - should be a valid key from your database
  apiKey: process.env.TEST_API_KEY || 'sk_test_your_key_here',

  // Number of PDFs to generate in sequence
  testCount: 10,

  // Expected latency thresholds
  coldStartMaxLatency: 2500, // 2.5s for first request
  warmRequestMaxLatency: 1500, // 1.5s for subsequent requests

  // Expected reuse rate
  minReuseRate: 0.80, // 80%
};

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
async function generatePdf(requestNumber) {
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
      html: `<html><body><h1>Test PDF #${requestNumber}</h1><p>Generated at ${new Date().toISOString()}</p></body></html>`,
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
    throw new Error(`PDF generation failed: ${result.error || 'Unknown error'}`);
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
 * Get Durable Object stats
 */
async function getDOStats(doIndex = 0) {
  try {
    const response = await makeRequest(
      `${CONFIG.apiUrl}/api/browser-pool/${doIndex}/stats`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.apiKey}`,
        },
      }
    );

    if (response.status === 200) {
      return JSON.parse(response.body);
    }
  } catch (error) {
    console.warn(`⚠️  Could not fetch DO stats: ${error.message}`);
  }
  return null;
}

/**
 * Run browser pooling test
 */
async function runTest() {
  console.log('🧪 Browser Pooling E2E Test\n');
  console.log(`API URL: ${CONFIG.apiUrl}`);
  console.log(`Test Count: ${CONFIG.testCount} PDFs\n`);

  const results = [];
  let warmHits = 0;

  console.log('📊 Generating PDFs...\n');

  for (let i = 1; i <= CONFIG.testCount; i++) {
    try {
      const result = await generatePdf(i);
      results.push(result);

      if (result.browserPoolHit) {
        warmHits++;
      }

      const status = result.browserPoolHit ? '🔥 WARM' : '❄️  COLD';
      console.log(
        `[${i}/${CONFIG.testCount}] ${status} | ${result.latency}ms | Size: ${(result.size / 1024).toFixed(1)}KB`
      );
    } catch (error) {
      console.error(`❌ Request ${i} failed: ${error.message}`);
      results.push({
        requestNumber: i,
        latency: null,
        browserPoolHit: false,
        error: error.message,
      });
    }

    // Small delay between requests to avoid rate limiting
    if (i < CONFIG.testCount) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log('\n📈 Test Results:\n');

  // Calculate metrics
  const successfulResults = results.filter((r) => r.latency !== null);
  const failedResults = results.filter((r) => r.latency === null);

  if (successfulResults.length === 0) {
    console.error('❌ All requests failed!');
    process.exit(1);
  }

  const latencies = successfulResults.map((r) => r.latency);
  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const p50Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.5)];
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

  const coldStartLatency = results[0].latency;
  const warmLatencies = successfulResults.slice(1).map((r) => r.latency);
  const avgWarmLatency =
    warmLatencies.length > 0
      ? warmLatencies.reduce((sum, lat) => sum + lat, 0) / warmLatencies.length
      : null;

  const reuseRate = warmHits / (successfulResults.length - 1); // Exclude first request

  // Calculate throughput
  const totalTime = (results[results.length - 1]?.latency || 0) + (CONFIG.testCount - 1) * 100; // Including delays
  const throughputPerMinute = (successfulResults.length / totalTime) * 60000;

  console.log(`✅ Success Rate: ${successfulResults.length}/${CONFIG.testCount} (${((successfulResults.length / CONFIG.testCount) * 100).toFixed(1)}%)`);
  if (failedResults.length > 0) {
    console.log(`❌ Failed Requests: ${failedResults.length}`);
  }

  console.log(`\n⏱️  Latency Metrics:`);
  console.log(`   Min:  ${minLatency}ms`);
  console.log(`   Max:  ${maxLatency}ms`);
  console.log(`   Avg:  ${avgLatency.toFixed(0)}ms`);
  console.log(`   P50:  ${p50Latency}ms`);
  console.log(`   P95:  ${p95Latency}ms`);

  if (coldStartLatency !== null) {
    console.log(`\n🥶 Cold Start (Request #1): ${coldStartLatency}ms`);
  }

  if (avgWarmLatency !== null) {
    console.log(`🔥 Warm Average (Requests #2-${CONFIG.testCount}): ${avgWarmLatency.toFixed(0)}ms`);
    console.log(`   Improvement: ${((coldStartLatency - avgWarmLatency) / coldStartLatency * 100).toFixed(1)}% faster`);
  }

  console.log(`\n♻️  Browser Reuse Rate: ${(reuseRate * 100).toFixed(1)}% (${warmHits}/${successfulResults.length - 1} warm hits)`);
  console.log(`⚡ Throughput: ${throughputPerMinute.toFixed(0)} PDFs/minute`);

  // Fetch DO stats
  console.log(`\n📊 Durable Object Stats:`);
  const doStats = await getDOStats(0);
  if (doStats) {
    console.log(`   Pool Size: ${doStats.browserInstances?.length || 0} browsers`);
    console.log(`   Total PDFs Generated: ${doStats.totalPdfsGenerated || 0}`);
    console.log(`   Current Load: ${doStats.currentLoad || 0}`);
    if (doStats.metrics) {
      console.log(`   Reuse Rate: ${doStats.metrics.reusePercentage || 0}%`);
      console.log(`   Warm Hits: ${doStats.metrics.warmBrowserHits || 0}`);
      console.log(`   Cold Starts: ${doStats.metrics.coldBrowserStarts || 0}`);
      console.log(`   FIFO Evictions: ${doStats.metrics.fifoEvictions || 0}`);
      console.log(`   Health Check Failures: ${doStats.metrics.healthCheckFailures || 0}`);
    }
  }

  // Validate against success criteria
  console.log(`\n🎯 Success Criteria Validation:\n`);

  let passed = true;

  // Check cold start latency
  if (coldStartLatency !== null) {
    const coldStartPass = coldStartLatency <= CONFIG.coldStartMaxLatency;
    console.log(
      `${coldStartPass ? '✅' : '❌'} Cold start latency ≤${CONFIG.coldStartMaxLatency}ms: ${coldStartLatency}ms`
    );
    passed = passed && coldStartPass;
  }

  // Check warm request latency
  if (avgWarmLatency !== null) {
    const warmLatencyPass = avgWarmLatency <= CONFIG.warmRequestMaxLatency;
    console.log(
      `${warmLatencyPass ? '✅' : '❌'} Warm request avg ≤${CONFIG.warmRequestMaxLatency}ms: ${avgWarmLatency.toFixed(0)}ms`
    );
    passed = passed && warmLatencyPass;
  }

  // Check reuse rate
  const reusePass = reuseRate >= CONFIG.minReuseRate;
  console.log(
    `${reusePass ? '✅' : '❌'} Browser reuse rate ≥${(CONFIG.minReuseRate * 100).toFixed(0)}%: ${(reuseRate * 100).toFixed(1)}%`
  );
  passed = passed && reusePass;

  // Check throughput (100+ PDFs/min)
  const throughputPass = throughputPerMinute >= 100;
  console.log(
    `${throughputPass ? '✅' : '❌'} Throughput ≥100 PDFs/min: ${throughputPerMinute.toFixed(0)} PDFs/min`
  );
  passed = passed && throughputPass;

  console.log(`\n${passed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}\n`);

  if (!passed) {
    process.exit(1);
  }
}

// Run the test
runTest().catch((error) => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
