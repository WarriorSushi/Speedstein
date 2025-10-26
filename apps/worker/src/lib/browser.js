/**
 * Simplified Browser Service (No Pooling)
 *
 * Launches a fresh browser instance for each PDF generation request.
 * This is simpler and more reliable than session pooling in Workers.
 *
 * Future: Move to Durable Objects for proper session pooling and reuse.
 *
 * @packageDocumentation
 */
import puppeteer from '@cloudflare/puppeteer';
import { BrowserError } from '@speedstein/shared/lib/errors';
/**
 * Simplified Browser Service
 *
 * Launches a browser instance for each request and disposes it after use.
 * This ensures clean state and avoids session management complexity.
 */
export class SimpleBrowserService {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute a function with a browser instance
     *
     * The browser is automatically launched before the function executes
     * and disposed after (even if the function throws an error).
     *
     * @param fn - Function to execute with browser instance
     * @returns Result of the function
     *
     * @example
     * ```typescript
     * const browserService = new SimpleBrowserService({ browserBinding: env.BROWSER });
     *
     * const pdfBuffer = await browserService.withBrowser(async (browser) => {
     *   const page = await browser.newPage();
     *   await page.setContent(html);
     *   return await page.pdf({ format: 'A4' });
     * });
     * ```
     */
    async withBrowser(fn) {
        let browser = null;
        try {
            // Launch a fresh browser instance
            browser = await puppeteer.launch(this.config.browserBinding);
            // Execute the user's function with the browser
            const result = await fn(browser);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BrowserError(`Browser operation failed: ${errorMessage}`);
        }
        finally {
            // Always close the browser, even if an error occurred
            if (browser) {
                try {
                    await browser.close();
                }
                catch (closeError) {
                    // Log but don't throw - we don't want to mask the original error
                    console.error('Error closing browser:', closeError);
                }
            }
        }
    }
    /**
     * Execute a function with a browser page
     *
     * Convenience method that creates a page from a browser instance.
     * Both the page and browser are automatically disposed after use.
     *
     * @param fn - Function to execute with page instance
     * @returns Result of the function
     *
     * @example
     * ```typescript
     * const pdfBuffer = await browserService.withPage(async (page) => {
     *   await page.setContent('<html><body><h1>Hello</h1></body></html>');
     *   return await page.pdf({ format: 'A4' });
     * });
     * ```
     */
    async withPage(fn) {
        return this.withBrowser(async (browser) => {
            const page = await browser.newPage();
            try {
                return await fn(page);
            }
            finally {
                // Close the page (browser will be closed by withBrowser)
                try {
                    await page.close();
                }
                catch (error) {
                    console.error('Error closing page:', error);
                }
            }
        });
    }
}
