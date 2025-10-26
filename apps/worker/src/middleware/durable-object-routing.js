/**
 * Durable Object Routing Middleware
 *
 * Routes REST API requests through Durable Objects browser pool for performance.
 * Extracts user ID, creates DO stub, and provides browser instance to PdfService.
 */
import { getDOStubForUser } from '../lib/browser-pool-manager';
/**
 * Extract user ID from API key or session
 *
 * @param apiKey - Validated API key from authentication
 * @param authContext - Authentication context with userId
 * @returns User ID for routing
 */
export function extractUserIdForRouting(authContext) {
    // Use userId from authentication context
    return authContext.userId;
}
/**
 * Create Durable Object routing context for a user
 *
 * @param userId - User ID for routing
 * @param namespace - DurableObjectNamespace binding
 * @returns Durable Object context
 */
export function createDurableObjectContext(userId, namespace, enabled = true) {
    if (!enabled) {
        return {
            userId,
            doStub: null, // Not used when disabled
            doId: 'disabled',
            enabled: false,
        };
    }
    const doStub = getDOStubForUser(userId, namespace);
    const doId = doStub.id.toString();
    return {
        userId,
        doStub,
        doId,
        enabled: true,
    };
}
/**
 * Acquire browser instance from Durable Object pool
 *
 * @param doContext - Durable Object routing context
 * @param html - HTML content for PDF generation
 * @param options - PDF options
 * @returns Browser instance or null if failed
 */
export async function acquireBrowserFromDO(doContext, html, options) {
    const startTime = Date.now();
    if (!doContext.enabled) {
        return {
            acquisitionTime: 0,
            error: 'Durable Objects routing disabled',
        };
    }
    try {
        // Create request to Durable Object
        const request = new Request('https://fake-host/generate?action=generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html, options }),
        });
        // Forward to Durable Object browser pool
        const response = await doContext.doStub.fetch(request);
        const acquisitionTime = Date.now() - startTime;
        if (!response.ok) {
            const result = (await response.json());
            return {
                acquisitionTime,
                error: result.error || `HTTP ${response.status}`,
            };
        }
        // Note: In the current implementation, BrowserPoolDO returns the full PDF result
        // For REST API routing, we would need to modify BrowserPoolDO to support
        // browser acquisition without PDF generation, or use the existing flow
        // For now, we'll use the full PDF generation path through DO
        return {
            acquisitionTime,
        };
    }
    catch (error) {
        const acquisitionTime = Date.now() - startTime;
        return {
            acquisitionTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Generate PDF through Durable Object (full flow)
 *
 * This is the recommended approach for REST API routing - let the DO handle
 * the full PDF generation flow including browser management.
 *
 * @param doContext - Durable Object routing context
 * @param html - HTML content
 * @param options - PDF options
 * @returns PDF result or error
 */
export async function generatePdfThroughDO(doContext, html, options) {
    if (!doContext.enabled) {
        return {
            success: false,
            error: 'Durable Objects routing disabled',
        };
    }
    try {
        // Create request to Durable Object
        const request = new Request('https://fake-host/generate?action=generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html, options }),
        });
        // Forward to Durable Object browser pool
        const response = await doContext.doStub.fetch(request);
        const result = (await response.json());
        if (!response.ok) {
            return {
                success: false,
                error: result.error || `HTTP ${response.status}`,
            };
        }
        return {
            success: true,
            pdf_url: result.pdf_url,
            size: result.size, // Pass through PDF size
            expiresAt: result.expiresAt,
            pdfBuffer: result.pdfBuffer ? new Uint8Array(result.pdfBuffer) : undefined,
            generationTime: result.generationTime,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Check if Durable Objects routing is enabled
 *
 * @param env - Environment bindings
 * @returns Whether DO routing is enabled
 */
export function isDurableObjectsEnabled(env) {
    // Default to true if not specified (feature flag)
    const enabled = env.ENABLE_DURABLE_OBJECTS;
    if (enabled === undefined || enabled === '') {
        return true; // Default: enabled
    }
    return enabled === 'true' || enabled === '1' || enabled === 'yes';
}
/**
 * Log Durable Object routing metrics
 *
 * @param doContext - DO routing context
 * @param generationTime - Total PDF generation time
 * @param logger - Logger instance
 */
export function logDurableObjectMetrics(doContext, generationTime, logger) {
    if (!doContext.enabled) {
        logger.info('Durable Objects routing disabled, using SimpleBrowserService');
        return;
    }
    logger.info('PDF generated via Durable Objects', {
        doId: doContext.doId,
        userId: doContext.userId,
        browserAcquisitionTime: doContext.browserAcquisitionTime,
        generationTime,
        throughput: generationTime > 0 ? Math.round((1000 / generationTime) * 60) : 0,
    });
}
