/**
 * Durable Object for managing a pool of warm Chrome browser instances
 *
 * This DO maintains 1-5 warm browser instances for fast PDF generation without cold starts.
 * Browser instances are reused across multiple requests and recycled after 1000 PDFs or 1 hour.
 */
import puppeteer from '@cloudflare/puppeteer';
import { uploadPdfToR2, generatePdfFileName } from '../lib/r2';
export class BrowserPoolDO {
    state;
    env;
    browserPoolState;
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
                // Upload PDF to R2 storage with tier-based lifecycle tagging
                try {
                    const fileName = generatePdfFileName();
                    const uploadResult = await uploadPdfToR2({
                        bucket: this.env.R2_BUCKET,
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
        return new Response(JSON.stringify(this.browserPoolState), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    /**
     * Acquire a browser instance from the pool or create a new one
     * Implements browser pool management with 1-5 warm instances
     */
    async acquireBrowser() {
        this.browserPoolState.currentLoad++;
        this.browserPoolState.lastActivityAt = new Date();
        // Check for available idle browser instances
        const idleBrowser = this.browserPoolState.browserInstances.find((b) => b.status === 'idle' && b.browserHandle);
        if (idleBrowser && idleBrowser.browserHandle) {
            // Reuse existing idle browser
            idleBrowser.status = 'active';
            idleBrowser.lastUsedAt = new Date();
            console.log(`Reusing browser instance: ${idleBrowser.instanceId}`);
            return idleBrowser.browserHandle;
        }
        // Check if we can create a new browser (max 5 instances)
        if (this.browserPoolState.browserInstances.length < 5) {
            console.log('Launching new browser instance...');
            const browser = await puppeteer.launch(this.env.BROWSER);
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
            console.log(`Created new browser instance: ${newInstance.instanceId}`);
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
     */
    async releaseBrowser(browser) {
        this.browserPoolState.currentLoad--;
        this.browserPoolState.lastActivityAt = new Date();
        // Find the browser instance in our pool
        const instance = this.browserPoolState.browserInstances.find((b) => b.browserHandle === browser);
        if (!instance) {
            console.warn('Browser not found in pool, closing it');
            await browser.close();
            return;
        }
        instance.pdfsGenerated++;
        this.browserPoolState.totalPdfsGenerated++;
        // Check if browser needs recycling (1000 PDFs or 1 hour)
        const browserAge = Date.now() - instance.createdAt.getTime();
        const oneHour = 60 * 60 * 1000;
        if (instance.pdfsGenerated >= 1000 || browserAge >= oneHour) {
            console.log(`Browser ${instance.instanceId} needs recycling (PDFs: ${instance.pdfsGenerated}, Age: ${Math.round(browserAge / 1000 / 60)}min)`);
            await this.recycleBrowser(instance.instanceId);
            return;
        }
        // Return browser to idle state
        instance.status = 'idle';
        instance.lastUsedAt = new Date();
        console.log(`Browser ${instance.instanceId} returned to idle state`);
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
     * Cleanup idle browser instances (5-minute idle timeout)
     * Closes browsers that have been idle for more than 5 minutes
     */
    async cleanup() {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        console.log('Running browser pool cleanup...');
        const idleInstances = this.browserPoolState.browserInstances.filter((instance) => {
            if (instance.status !== 'idle')
                return false;
            const idleTime = now - instance.lastUsedAt.getTime();
            return idleTime >= fiveMinutes;
        });
        if (idleInstances.length === 0) {
            console.log('No idle browsers to clean up');
            return;
        }
        console.log(`Cleaning up ${idleInstances.length} idle browser(s)`);
        // Recycle each idle browser
        for (const instance of idleInstances) {
            const idleMinutes = Math.round((now - instance.lastUsedAt.getTime()) / 1000 / 60);
            console.log(`Cleaning up browser ${instance.instanceId} (idle for ${idleMinutes} minutes)`);
            await this.recycleBrowser(instance.instanceId);
        }
        console.log(`Cleanup complete. Remaining browsers: ${this.browserPoolState.browserInstances.length}`);
    }
}
