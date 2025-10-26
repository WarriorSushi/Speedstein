/**
 * PDF Generation Service
 *
 * Core service for generating PDFs from HTML using Cloudflare Browser Rendering API.
 * Handles browser session management, PDF options parsing, and resource disposal.
 *
 * @packageDocumentation
 */
import { DEFAULT_PDF_OPTIONS, MAX_HTML_SIZE_BYTES, PDF_GENERATION_TIMEOUT_MS, } from '@speedstein/shared/types/pdf';
import { BrowserError, GenerationTimeoutError, PayloadTooLargeError, } from '@speedstein/shared/lib/errors';
import { hashHtmlContent } from '../lib/crypto';
/**
 * PDF Service
 *
 * Handles PDF generation from HTML using Cloudflare Browser Rendering API.
 * Uses SimpleBrowserService for per-request browser instances.
 */
export class PdfService {
    browserService;
    constructor(browserService) {
        this.browserService = browserService;
    }
    /**
     * Generate a PDF from HTML content
     *
     * @param html - HTML content to convert
     * @param options - PDF generation options
     * @param metadata - Request metadata (userId, apiKeyId, requestId)
     * @param browser - Optional Browser instance from Durable Object pool (bypasses browserService)
     * @returns Generated PDF buffer and metadata
     * @throws BrowserError if PDF generation fails
     * @throws GenerationTimeoutError if generation exceeds timeout
     * @throws PayloadTooLargeError if HTML exceeds size limit
     */
    async generatePdf(html, options, metadata, browser) {
        const startTime = Date.now();
        // Validate HTML size
        this.validateHtmlSize(html);
        // Parse and merge options with defaults
        const pdfOptions = this.parseOptions(options);
        // Convert to Puppeteer format
        const puppeteerOptions = this.convertToPuppeteerOptions(pdfOptions);
        // Hash HTML for deduplication
        const htmlHash = await hashHtmlContent(html);
        const htmlSize = new TextEncoder().encode(html).length;
        try {
            let pdfBuffer;
            // Use provided Browser from DO pool or fall back to SimpleBrowserService
            if (browser) {
                // Browser from Durable Object pool - use directly
                pdfBuffer = await this.generatePdfWithBrowser(browser, html, puppeteerOptions);
            }
            else {
                // Fall back to SimpleBrowserService (per-request browser)
                pdfBuffer = await this.browserService.withPage(async (page) => {
                    // Set timeout for PDF generation
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new GenerationTimeoutError()), PDF_GENERATION_TIMEOUT_MS);
                    });
                    // Generate PDF with timeout
                    const pdfPromise = this.generatePdfWithPage(page, html, puppeteerOptions);
                    return (await Promise.race([pdfPromise, timeoutPromise]));
                });
            }
            const generationTime = Date.now() - startTime;
            const pdfSize = pdfBuffer.byteLength;
            return {
                pdfBuffer,
                generationTime,
                htmlHash,
                htmlSize,
                pdfSize,
            };
        }
        catch (error) {
            if (error instanceof GenerationTimeoutError) {
                throw error;
            }
            if (error instanceof BrowserError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BrowserError(`Failed to generate PDF: ${errorMessage}`, {
                requestId: metadata.requestId,
                error: errorMessage,
            });
        }
    }
    /**
     * Generate PDF using a Browser instance from Durable Object pool
     * Handles browser crashes and retries with error handling
     * @private
     */
    async generatePdfWithBrowser(browser, html, options) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new GenerationTimeoutError()), PDF_GENERATION_TIMEOUT_MS);
        });
        try {
            // Create new page from browser instance
            const page = await browser.newPage();
            try {
                // Generate PDF with timeout
                const pdfPromise = this.generatePdfWithPage(page, html, options);
                const pdfBuffer = (await Promise.race([pdfPromise, timeoutPromise]));
                return pdfBuffer;
            }
            finally {
                // Always close the page to free resources
                await page.close();
            }
        }
        catch (error) {
            // Browser crashes are handled by Durable Object (automatic recycling)
            // Rethrow error for caller to handle
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BrowserError(`Browser pool PDF generation failed: ${errorMessage}`);
        }
    }
    /**
     * Generate PDF using a browser page instance
     * @private
     */
    async generatePdfWithPage(page, html, options) {
        try {
            // Set HTML content
            await page.setContent(html, {
                waitUntil: 'networkidle0', // Wait for network to be idle
            });
            // Generate PDF
            const pdfBuffer = await page.pdf(options);
            return pdfBuffer;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BrowserError(`Browser PDF generation failed: ${errorMessage}`);
        }
    }
    /**
     * Parse and validate PDF options
     *
     * Merges user-provided options with defaults.
     */
    parseOptions(userOptions) {
        return {
            format: userOptions?.format ?? DEFAULT_PDF_OPTIONS.format,
            orientation: userOptions?.orientation ?? DEFAULT_PDF_OPTIONS.orientation,
            printBackground: userOptions?.printBackground ?? DEFAULT_PDF_OPTIONS.printBackground,
            margin: userOptions?.margin,
            scale: userOptions?.scale ?? DEFAULT_PDF_OPTIONS.scale,
            displayHeaderFooter: userOptions?.displayHeaderFooter ?? DEFAULT_PDF_OPTIONS.displayHeaderFooter,
            headerTemplate: userOptions?.headerTemplate,
            footerTemplate: userOptions?.footerTemplate,
            preferCSSPageSize: userOptions?.preferCSSPageSize ?? DEFAULT_PDF_OPTIONS.preferCSSPageSize,
        };
    }
    /**
     * Convert Speedstein PDF options to Puppeteer format
     *
     * Puppeteer uses lowercase formats and landscape boolean instead of orientation enum.
     */
    convertToPuppeteerOptions(options) {
        const puppeteerOptions = {
            printBackground: options.printBackground,
            scale: options.scale,
            preferCSSPageSize: options.preferCSSPageSize,
        };
        // Convert format to lowercase
        if (options.format) {
            puppeteerOptions.format = options.format.toLowerCase();
        }
        // Convert orientation to landscape boolean
        if (options.orientation) {
            puppeteerOptions.landscape = options.orientation === 'landscape';
        }
        // Add margins if provided
        if (options.margin) {
            puppeteerOptions.margin = options.margin;
        }
        // Add header/footer if enabled
        if (options.displayHeaderFooter) {
            puppeteerOptions.displayHeaderFooter = true;
            if (options.headerTemplate) {
                puppeteerOptions.headerTemplate = options.headerTemplate;
            }
            if (options.footerTemplate) {
                puppeteerOptions.footerTemplate = options.footerTemplate;
            }
        }
        return puppeteerOptions;
    }
    /**
     * Validate HTML size
     *
     * Ensures HTML content doesn't exceed the maximum allowed size (10MB).
     *
     * @throws PayloadTooLargeError if HTML exceeds size limit
     */
    validateHtmlSize(html) {
        const byteSize = new TextEncoder().encode(html).length;
        if (byteSize > MAX_HTML_SIZE_BYTES) {
            throw new PayloadTooLargeError(byteSize, MAX_HTML_SIZE_BYTES);
        }
    }
    /**
     * Calculate estimated PDF size based on HTML length
     *
     * This is a rough estimate used for logging and monitoring.
     * Actual PDF size depends on content complexity, images, fonts, etc.
     */
    calculateEstimatedSize(html) {
        // Very rough estimate: PDF is typically 20-40% of HTML size
        // Plus base overhead of ~5KB
        const htmlSize = new TextEncoder().encode(html).length;
        const baseOverhead = 5000;
        const estimatedSize = htmlSize * 0.3 + baseOverhead;
        return Math.round(estimatedSize);
    }
    /**
     * Sanitize PDF options to remove potentially dangerous settings
     *
     * Removes options like `path` that could cause security issues.
     */
    sanitizeOptions(options) {
        const { path, // Remove - we use in-memory buffers only
        timeout, // Remove - we control timeouts
        ...safeOptions } = options;
        return safeOptions;
    }
    /**
     * Get default PDF options
     */
    getDefaultOptions() {
        return { ...DEFAULT_PDF_OPTIONS };
    }
}
