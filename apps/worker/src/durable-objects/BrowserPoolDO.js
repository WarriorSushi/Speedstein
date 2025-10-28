/**
 * Durable Object for managing a pool of warm Chrome browser instances
 *
 * This DO maintains 8-16 warm browser instances for fast PDF generation without cold starts.
 * Key features:
 * - Session tracking with FIFO eviction after 5 minutes idle
 * - Dynamic pool scaling (8→16 browsers under load)
 * - Browser health monitoring and auto-recovery
 * - Request queueing with graceful handling of pool exhaustion
 * - Metrics tracking for browser reuse rates
 *
 * Performance targets:
 * - 80% browser reuse rate
 * - <50ms browser acquisition time (warm browsers)
 * - <2s P95 latency for PDF generation
 */
import puppeteer from '@cloudflare/puppeteer';
import { uploadPdfToR2, generatePdfFileName } from '../lib/r2';
import { BROWSER_POOL_CONFIG } from '../lib/constants';
export class BrowserPoolDO {
    state;
    env;
    browserPoolState;
    // Session tracking for metrics
    sessionMetrics = {
        totalBrowserAcquisitions: 0,
        warmBrowserHits: 0,
        coldBrowserStarts: 0,
        fifoEvictions: 0,
        healthCheckFailures: 0,
    };
    // Cleanup interval handle
    cleanupIntervalHandle;
    constructor(state, env) {
        this.state = state;
        this.env = env;
        // Initialize browser pool state
        this.browserPoolState = {
            objectId: state.id.toString(),
            browserInstances: [],
            requestQueue: [],
            createdAt: new Date(),
            lastActivityAt: new Date(),
            totalPdfsGenerated: 0,
            currentLoad: 0,
        };
        // Start periodic cleanup of idle browsers (every 30 seconds)
        this.scheduleCleanup();
    }
    /**
     * HTTP fetch handler for Durable Object requests
     * Routes requests to appropriate methods
     */
    async fetch(request) {
        try {
            const url = new URL(request.url);
            const action = url.searchParams.get('action');
            switch (action) {
                case 'generate-pdf':
                    return await this.handleGeneratePdf(request);
                case 'health':
                    return await this.handleHealth();
                case 'stats':
                    return await this.handleStats();
                default:
                    return new Response('Invalid action', { status: 400 });
            }
        }
        catch (error) {
            console.error('BrowserPoolDO fetch error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
    /**
     * Handle PDF generation request
     */
    async handleGeneratePdf(request) {
        const { html, options } = (await request.json());
        // Check if we're at capacity - return 503 if timeout exceeded
        const acquisitionStart = Date.now();
        let browser;
        try {
            browser = await this.acquireBrowser();
        }
        catch (error) {
            const waitTime = Date.now() - acquisitionStart;
            if (waitTime >= 5000) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Service temporarily unavailable - browser pool at capacity',
                }), {
                    status: 503,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '10',
                    },
                });
            }
            throw error;
        }
        try {
            const startTime = Date.now();
            // Generate PDF using the browser instance
            const page = await browser.newPage();
            try {
                await page.setContent(html, { waitUntil: 'networkidle0' });
                const pdfBuffer = await page.pdf(options); // Type cast - our PdfOptions is compatible with PDFOptions
                const generationTime = Date.now() - startTime;
                this.browserPoolState.totalPdfsGenerated++;
                this.browserPoolState.lastActivityAt = new Date();
                // For RPC requests, return buffer directly to avoid R2 round-trip latency
                const returnBuffer = options.returnBuffer === true;
                if (returnBuffer) {
                    // Fast path: Return PDF buffer directly (for RPC/WebSocket)
                    return new Response(JSON.stringify({
                        success: true,
                        pdfBuffer: Array.from(pdfBuffer),
                        size: pdfBuffer.length,
                        generationTime,
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                // Standard path: Upload PDF to R2 storage with tier-based lifecycle tagging
                try {
                    const fileName = generatePdfFileName();
                    const uploadResult = await uploadPdfToR2({
                        bucket: this.env.PDF_STORAGE, // Corrected binding name
                        content: pdfBuffer,
                        fileName,
                        userTier: options.userTier || 'free',
                        metadata: {
                            userId: options.userId || 'anonymous',
                            generatedAt: new Date().toISOString(),
                            generationTime: generationTime.toString(),
                        },
                    });
                    // Return PDF URL and expiration time
                    return new Response(JSON.stringify({
                        success: true,
                        pdf_url: uploadResult.url,
                        size: uploadResult.size, // Include PDF size
                        expiresAt: uploadResult.expiresAt,
                        generationTime,
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                catch (r2Error) {
                    // Fallback: If R2 upload fails, return pdfBuffer (degraded mode)
                    console.error('R2 upload failed, falling back to buffer response:', r2Error);
                    return new Response(JSON.stringify({
                        success: true,
                        pdfBuffer: Array.from(pdfBuffer),
                        generationTime,
                        warning: 'PDF generated but not uploaded to storage. Using fallback buffer response.',
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            }
            finally {
                await page.close();
            }
        }
        finally {
            await this.releaseBrowser(browser);
        }
    }
    /**
     * Handle health check request
     */
    async handleHealth() {
        return new Response(JSON.stringify({
            status: 'healthy',
            objectId: this.browserPoolState.objectId,
            activeBrowsers: this.browserPoolState.browserInstances.filter((b) => b.status === 'active').length,
            totalPdfsGenerated: this.browserPoolState.totalPdfsGenerated,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    /**
     * Handle stats request
     */
    async handleStats() {
        // Calculate browser reuse rate
        const reuseRate = this.sessionMetrics.totalBrowserAcquisitions > 0
            ? this.sessionMetrics.warmBrowserHits / this.sessionMetrics.totalBrowserAcquisitions
            : 0;
        const stats = {
            ...this.browserPoolState,
            metrics: {
                ...this.sessionMetrics,
                reuseRate: Math.round(reuseRate * 100) / 100, // Round to 2 decimal places
                reusePercentage: Math.round(reuseRate * 100), // As percentage
            },
            poolCapacity: {
                current: this.browserPoolState.browserInstances.length,
                min: BROWSER_POOL_CONFIG.minPoolSize,
                max: BROWSER_POOL_CONFIG.maxPoolSize,
                utilizationPercent: Math.round((this.browserPoolState.currentLoad / BROWSER_POOL_CONFIG.maxPoolSize) * 100),
            },
        };
        return new Response(JSON.stringify(stats), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    /**
     * Schedule periodic cleanup of idle browsers
     *
     * Runs every 30 seconds to check for browsers that have been idle > 5 minutes
     * and evict them using FIFO (first in, first out) strategy.
     */
    scheduleCleanup() {
        // Clear existing interval if any
        if (this.cleanupIntervalHandle) {
            clearInterval(this.cleanupIntervalHandle);
        }
        // Schedule cleanup every 30 seconds
        this.cleanupIntervalHandle = setInterval(() => {
            this.cleanup().catch((error) => {
                console.error('Browser pool cleanup error:', error);
            });
        }, BROWSER_POOL_CONFIG.cleanupIntervalMs);
    }
    /**
     * Acquire a browser instance from the pool or create a new one
     * Implements browser pool management with 8-16 warm instances (dynamic scaling)
     */
    async acquireBrowser() {
        this.browserPoolState.currentLoad++;
        this.browserPoolState.lastActivityAt = new Date();
        this.sessionMetrics.totalBrowserAcquisitions++;
        // Check for available idle browser instances
        const idleBrowser = this.browserPoolState.browserInstances.find((b) => b.status === 'idle' && b.browserHandle);
        if (idleBrowser && idleBrowser.browserHandle) {
            // Reuse existing idle browser (warm hit!)
            idleBrowser.status = 'active';
            idleBrowser.lastUsedAt = new Date();
            this.sessionMetrics.warmBrowserHits++;
            console.log(`[Pool] Warm browser reuse: ${idleBrowser.instanceId} (reuse rate: ${Math.round((this.sessionMetrics.warmBrowserHits / this.sessionMetrics.totalBrowserAcquisitions) * 100)}%)`);
            return idleBrowser.browserHandle;
        }
        // Determine current pool capacity based on load
        const currentPoolSize = this.browserPoolState.browserInstances.length;
        const maxPoolSize = this.getMaxPoolSize();
        // Check if we can create a new browser (dynamic scaling 8→16)
        if (currentPoolSize < maxPoolSize) {
            console.log(`[Pool] Launching new browser (${currentPoolSize + 1}/${maxPoolSize})...`);
            const browser = await puppeteer.launch(this.env.BROWSER);
            this.sessionMetrics.coldBrowserStarts++;
            const newInstance = {
                instanceId: `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                browserHandle: browser,
                createdAt: new Date(),
                pdfsGenerated: 0,
                lastUsedAt: new Date(),
                memoryUsage: 0, // Will be estimated
                status: 'active',
            };
            this.browserPoolState.browserInstances.push(newInstance);
            console.log(`[Pool] Created new browser: ${newInstance.instanceId} (pool size: ${this.browserPoolState.browserInstances.length}/${maxPoolSize})`);
            return browser;
        }
        // Pool is at capacity - wait for an available browser or timeout
        console.log('Browser pool at capacity, waiting for available instance...');
        const startWait = Date.now();
        const maxWaitTime = 5000; // 5 seconds
        while (Date.now() - startWait < maxWaitTime) {
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
            const nowIdleBrowser = this.browserPoolState.browserInstances.find((b) => b.status === 'idle' && b.browserHandle);
            if (nowIdleBrowser && nowIdleBrowser.browserHandle) {
                nowIdleBrowser.status = 'active';
                nowIdleBrowser.lastUsedAt = new Date();
                return nowIdleBrowser.browserHandle;
            }
        }
        // Timeout - force recycle oldest browser and create new one
        console.warn('Browser pool timeout - recycling oldest instance');
        const oldestBrowser = this.browserPoolState.browserInstances.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        if (oldestBrowser) {
            await this.recycleBrowser(oldestBrowser.instanceId);
        }
        // Launch new browser after recycling
        const browser = await puppeteer.launch(this.env.BROWSER);
        const newInstance = {
            instanceId: `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            browserHandle: browser,
            createdAt: new Date(),
            pdfsGenerated: 0,
            lastUsedAt: new Date(),
            memoryUsage: 0,
            status: 'active',
        };
        this.browserPoolState.browserInstances.push(newInstance);
        return browser;
    }
    /**
     * Release a browser instance back to the pool
     * Returns browser to idle state or closes if needs recycling
     * Includes health check to detect crashed browsers
     */
    async releaseBrowser(browser) {
        this.browserPoolState.currentLoad--;
        this.browserPoolState.lastActivityAt = new Date();
        // Find the browser instance in our pool
        const instance = this.browserPoolState.browserInstances.find((b) => b.browserHandle === browser);
        if (!instance) {
            console.warn('[Pool] Browser not found in pool, closing it');
            await browser.close();
            return;
        }
        instance.pdfsGenerated++;
        this.browserPoolState.totalPdfsGenerated++;
        // Health check: Verify browser is still responsive
        const isHealthy = await this.checkBrowserHealth(browser, instance.instanceId);
        if (!isHealthy) {
            console.warn(`[Pool] Browser ${instance.instanceId} failed health check, recycling...`);
            instance.status = 'crashed';
            this.sessionMetrics.healthCheckFailures++;
            await this.recycleBrowser(instance.instanceId);
            return;
        }
        // Check if browser needs recycling (1000 PDFs or 1 hour)
        const browserAge = Date.now() - instance.createdAt.getTime();
        const maxAge = BROWSER_POOL_CONFIG.maxPoolAgeMs;
        if (instance.pdfsGenerated >= 1000 || browserAge >= maxAge) {
            console.log(`[Pool] Browser ${instance.instanceId} needs recycling (PDFs: ${instance.pdfsGenerated}, Age: ${Math.round(browserAge / 1000 / 60)}min)`);
            await this.recycleBrowser(instance.instanceId);
            return;
        }
        // Return browser to idle state
        instance.status = 'idle';
        instance.lastUsedAt = new Date();
        console.log(`[Pool] Browser ${instance.instanceId} returned to idle state`);
    }
    /**
     * Check browser health
     *
     * Verifies the browser is responsive by attempting to list pages.
     * Detects crashed or unresponsive browser instances.
     *
     * @param browser - Browser instance to check
     * @param instanceId - Browser instance ID for logging
     * @returns true if healthy, false if crashed/unresponsive
     */
    async checkBrowserHealth(browser, instanceId) {
        try {
            // Quick health check: Try to get browser pages
            // If browser has crashed, this will throw an error
            const pages = await Promise.race([
                browser.pages(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 2000)),
            ]);
            // Browser is healthy if we can list pages
            console.log(`[Pool] Health check passed for ${instanceId} (${pages.length} pages)`);
            return true;
        }
        catch (error) {
            console.error(`[Pool] Health check failed for ${instanceId}:`, error);
            return false;
        }
    }
    /**
     * Recycle a crashed or aged browser instance
     * Closes the browser and removes it from the pool
     */
    async recycleBrowser(instanceId) {
        const instance = this.browserPoolState.browserInstances.find((b) => b.instanceId === instanceId);
        if (!instance) {
            console.warn(`Browser instance ${instanceId} not found for recycling`);
            return;
        }
        try {
            // Close the browser if it's still open
            if (instance.browserHandle) {
                console.log(`Closing browser instance: ${instanceId}`);
                await instance.browserHandle.close();
            }
        }
        catch (error) {
            console.error(`Error closing browser ${instanceId}:`, error);
            // Continue with removal even if close fails
        }
        // Remove from pool
        this.browserPoolState.browserInstances = this.browserPoolState.browserInstances.filter((b) => b.instanceId !== instanceId);
        console.log(`Recycled browser ${instanceId}. Pool size: ${this.browserPoolState.browserInstances.length}`);
    }
    /**
     * Get maximum pool size based on current load (dynamic scaling)
     *
     * - Under 80% load: Keep minimum pool size (8 browsers)
     * - Over 80% load: Scale up to maximum (16 browsers)
     *
     * @returns Maximum allowed pool size
     */
    getMaxPoolSize() {
        const currentUtilization = this.browserPoolState.currentLoad / BROWSER_POOL_CONFIG.minPoolSize;
        if (currentUtilization >= BROWSER_POOL_CONFIG.scaleUpThreshold) {
            // High load → scale to max
            return BROWSER_POOL_CONFIG.maxPoolSize;
        }
        // Normal load → use min size
        return BROWSER_POOL_CONFIG.minPoolSize;
    }
    /**
     * Cleanup idle browser instances using FIFO eviction
     *
     * Implements FIFO (First In, First Out) strategy:
     * 1. Find browsers idle for > 5 minutes
     * 2. Sort by creation time (oldest first)
     * 3. Evict oldest browsers first
     *
     * This ensures fair rotation and prevents resource leaks.
     */
    async cleanup() {
        const now = Date.now();
        const idleTimeout = BROWSER_POOL_CONFIG.sessionTimeoutMs;
        console.log('[Pool] Running FIFO cleanup check...');
        // Find all idle browsers that have exceeded idle timeout
        const idleInstances = this.browserPoolState.browserInstances.filter((instance) => {
            if (instance.status !== 'idle')
                return false;
            const idleTime = now - instance.lastUsedAt.getTime();
            return idleTime >= idleTimeout;
        });
        if (idleInstances.length === 0) {
            console.log('[Pool] No idle browsers to clean up');
            return;
        }
        // Sort by creation time (FIFO - oldest first)
        const sortedByAge = idleInstances.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        console.log(`[Pool] FIFO eviction: Cleaning up ${sortedByAge.length} idle browser(s)`);
        // Recycle each idle browser (oldest first)
        for (const instance of sortedByAge) {
            const idleMinutes = Math.round((now - instance.lastUsedAt.getTime()) / 1000 / 60);
            const ageMinutes = Math.round((now - instance.createdAt.getTime()) / 1000 / 60);
            console.log(`[Pool] FIFO evict: ${instance.instanceId} (idle: ${idleMinutes}min, age: ${ageMinutes}min, pdfs: ${instance.pdfsGenerated})`);
            await this.recycleBrowser(instance.instanceId);
            this.sessionMetrics.fifoEvictions++;
        }
        console.log(`[Pool] Cleanup complete. Pool size: ${this.browserPoolState.browserInstances.length} (reuse rate: ${Math.round((this.sessionMetrics.warmBrowserHits / Math.max(1, this.sessionMetrics.totalBrowserAcquisitions)) * 100)}%)`);
    }
}
