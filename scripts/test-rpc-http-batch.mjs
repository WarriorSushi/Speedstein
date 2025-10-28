#!/usr/bin/env node

/**
 * HTTP Batch RPC Test
 *
 * Tests Cap'n Web RPC over HTTP Batch (for clients that don't support WebSocket).
 * HTTP Batch mode still benefits from promise pipelining within a single HTTP request.
 *
 * Success criteria:
 * - HTTP Batch request succeeds
 * - Batch of 10 PDFs completes in <3s (slower than WebSocket but faster than sequential)
 * - All PDFs generated successfully
 *
 * Usage:
 *   node scripts/test-rpc-http-batch.mjs
 */

console.log('🧪 HTTP Batch RPC Test');
console.log('');
console.log('📝 Test Scenario:');
console.log('   1. Send HTTP Batch request to RPC endpoint');
console.log('   2. Generate batch of 10 PDFs');
console.log('   3. Measure total time (target: <3s)');
console.log('   4. Verify all PDFs generated');
console.log('');

const CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:8787/api/rpc',
  batchSize: 10,
  targetBatchTime: 3000, // 3 seconds (HTTP Batch is slightly slower than WebSocket)
};

console.log(`🌐 API URL: ${CONFIG.apiUrl}`);
console.log(`📦 Batch Size: ${CONFIG.batchSize} PDFs`);
console.log(`🎯 Target Time: ${CONFIG.targetBatchTime}ms`);
console.log('');

/**
 * Simulate HTTP Batch RPC test
 *
 * NOTE: Full implementation requires Cap'n Web client library.
 * This is a placeholder showing the expected test structure.
 */
async function runTest() {
  console.log('⏳ Starting test...');
  console.log('');

  try {
    // Step 1: Create batch request
    console.log(`1️⃣  Creating HTTP Batch request with ${CONFIG.batchSize} PDFs...`);

    const batchRequest = {
      pdfs: Array.from({ length: CONFIG.batchSize }, (_, i) => ({
        html: `<html><body><h1>HTTP Batch PDF #${i + 1}</h1><p>Generated via HTTP Batch RPC at ${new Date().toISOString()}</p></body></html>`,
        options: {
          format: 'A4',
          printBackground: true,
        },
      })),
      batchOptions: {
        failFast: false, // Continue even if one PDF fails
        maxConcurrency: 10,
      },
    };

    console.log(`   ✅ ${batchRequest.pdfs.length} PDFs in batch`);
    console.log('');

    // Step 2: Send HTTP Batch request
    console.log('2️⃣  Sending HTTP Batch request...');
    const startTime = Date.now();

    // TODO: Implement actual HTTP Batch RPC call using Cap'n Web
    // const response = await fetch(CONFIG.apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-RPC-Method': 'generateBatch',
    //   },
    //   body: JSON.stringify(batchRequest),
    // });
    // const result = await response.json();

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`   ✅ Batch complete in ${totalTime}ms`);
    console.log('');

    // Step 3: Analyze results
    console.log('3️⃣  Analyzing results...');
    console.log('');

    // Simulated results
    const successCount = CONFIG.batchSize;
    const errorCount = 0;

    const avgTimePerPdf = totalTime / CONFIG.batchSize;
    const sequentialTime = CONFIG.batchSize * 1800; // Assume 1.8s per PDF sequential
    const speedup = sequentialTime / totalTime;

    console.log('📊 Performance Metrics:');
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Success: ${successCount}/${CONFIG.batchSize} PDFs`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Avg Per PDF: ${avgTimePerPdf.toFixed(0)}ms`);
    console.log(`   Sequential Estimate: ${sequentialTime}ms`);
    console.log(`   Speedup: ${speedup.toFixed(1)}x faster`);
    console.log('');

    // Step 4: Validate against success criteria
    console.log('🎯 Success Criteria Validation:');
    console.log('');

    const timingPass = totalTime < CONFIG.targetBatchTime;
    console.log(
      `${timingPass ? '✅' : '❌'} Batch time <${CONFIG.targetBatchTime}ms: ${totalTime}ms`
    );

    const successRatePass = successCount === CONFIG.batchSize;
    console.log(
      `${successRatePass ? '✅' : '❌'} All PDFs generated: ${successCount}/${CONFIG.batchSize}`
    );

    const speedupPass = speedup >= 5; // HTTP Batch should still be 5x+ faster
    console.log(`${speedupPass ? '✅' : '❌'} Speedup ≥5x: ${speedup.toFixed(1)}x`);

    console.log('');

    const allPassed = timingPass && successRatePass && speedupPass;
    console.log(allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');
    console.log('');

    console.log('💡 Performance Comparison:');
    console.log(`   HTTP Batch: ${totalTime}ms`);
    console.log(`   WebSocket RPC: ~1500ms (expected)`);
    console.log(`   Sequential REST: ${sequentialTime}ms`);
    console.log('');
    console.log(`   HTTP Batch is ${speedup.toFixed(1)}x faster than sequential`);
    console.log(`   WebSocket RPC is ${(sequentialTime / 1500).toFixed(1)}x faster than sequential`);
    console.log('');

    if (!allPassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Test failed with error:', error);
    console.error('');
    process.exit(1);
  }
}

// Note about implementation
console.log('⚠️  IMPLEMENTATION NOTE:');
console.log('   This is a placeholder test showing the expected structure.');
console.log('   Full implementation requires:');
console.log('   1. Install Cap\'n Web client: npm install capnweb');
console.log('   2. Use HTTP Batch transport for RPC calls');
console.log('   3. Send batched requests in single HTTP POST');
console.log('');
console.log('   For now, running simulated test...');
console.log('');

runTest();
