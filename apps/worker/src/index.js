/**
 * Speedstein PDF API Worker
 *
 * Cloudflare Worker for PDF generation API.
 * Handles authentication, rate limiting, PDF generation, and usage tracking.
 *
 * @packageDocumentation
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PdfService } from './services/pdf.service';
import { AuthService } from './services/auth.service';
import { QuotaService } from './services/quota.service';
import { SimpleBrowserService } from './lib/browser';
import { RateLimiter } from './middleware/rate-limit';
import { uploadPdfToR2, generatePdfFileName } from './lib/r2';
import { createLogger } from './lib/logger';
import { generateRequestId, hashHtmlContent } from './lib/crypto';
import { GeneratePdfSchema } from '@speedstein/shared/lib/validation';
import { handleWebSocketUpgrade } from './middleware/websocket';
import { createDurableObjectContext, generatePdfThroughDO, isDurableObjectsEnabled, logDurableObjectMetrics, extractUserIdForRouting, } from './middleware/durable-object-routing';
import { UnauthorizedError, QuotaExceededError, RateLimitExceededError, ValidationError, } from '@speedstein/shared/lib/errors';
// Export Durable Object class for Cloudflare Workers runtime
export { BrowserPoolDO } from './durable-objects/BrowserPoolDO';
/**
 * Hono app instance with environment bindings
 */
const app = new Hono();
/**
 * Create browser service for this request
 *
 * Note: Each request gets a fresh browser instance for now.
 * Future: Move to Durable Objects for proper session pooling.
 */
function getBrowserService(env) {
    return new SimpleBrowserService({
        browserBinding: env.BROWSER,
    });
}
/**
 * CORS configuration
 */
app.use('/*', cors({
    origin: ['https://speedstein.com', 'https://www.speedstein.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));
/**
 * Health check endpoint
 */
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'speedstein-api',
    });
});
/**
 * GET /api/rpc - WebSocket RPC endpoint for Cap'n Web
 *
 * Upgrades HTTP connection to WebSocket for high-performance batch PDF generation.
 * Uses Cap'n Web promise pipelining to achieve 100+ PDFs/min throughput.
 *
 * @route GET /api/rpc
 * @websocket
 *
 * @example
 * ```javascript
 * const ws = new WebSocket('wss://api.speedstein.com/api/rpc?userId=user_123');
 * ws.onopen = () => {
 *   // Send RPC request
 *   ws.send(JSON.stringify({
 *     method: 'generatePdf',
 *     params: { html: '<h1>Test</h1>', options: {} }
 *   }));
 * };
 * ```
 */
app.get('/api/rpc', async (c) => {
    return handleWebSocketUpgrade(c.req.raw, c.env);
});
/**
 * POST /api/generate - Generate PDF from HTML
 *
 * Main endpoint for PDF generation. Requires API key authentication.
 *
 * @route POST /api/generate
 * @security ApiKey
 *
 * @example
 * ```bash
 * curl -X POST https://api.speedstein.com/api/generate \
 *   -H "Authorization: Bearer sk_live_..." \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "html": "<html><body>Invoice</body></html>",
 *     "options": {
 *       "format": "A4",
 *       "orientation": "portrait"
 *     }
 *   }'
 * ```
 */
app.post('/api/generate', async (c) => {
    const requestId = generateRequestId();
    const logger = createLogger(requestId);
    const startTime = Date.now();
    try {
        // 1. Extract API key from Authorization header
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid Authorization header');
        }
        const apiKey = authHeader.substring(7); // Remove "Bearer " prefix
        // 2. Parse and validate request body
        const body = await c.req.json();
        const validationResult = GeneratePdfSchema.safeParse(body);
        if (!validationResult.success) {
            throw new ValidationError('Invalid request body', validationResult.error.errors);
        }
        const { html, options } = validationResult.data;
        // 3. Initialize services
        const authService = new AuthService(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
        // Create Supabase client for quota service
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
        const quotaService = new QuotaService(supabase);
        const browserService = getBrowserService(c.env);
        const pdfService = new PdfService(browserService);
        // 4. Authenticate API key
        const authContext = await authService.validateApiKey(apiKey);
        logger.logAuth({
            success: true,
            userId: authContext.userId,
        });
        // 5. Check rate limit (anti-DDoS protection)
        const rateLimiter = new RateLimiter({
            kv: c.env.RATE_LIMIT_KV,
            maxRequests: 1000, // 1000 requests per minute
            windowSeconds: 60,
            keyPrefix: 'api:ratelimit:',
        });
        const rateLimitResult = await rateLimiter.checkLimit(authContext.userId);
        logger.logRateLimit({
            identifier: authContext.userId,
            allowed: rateLimitResult.allowed,
            currentCount: rateLimitResult.currentCount,
            limit: rateLimitResult.limit,
            retryAfter: rateLimitResult.retryAfter,
        });
        if (!rateLimitResult.allowed) {
            throw new RateLimitExceededError(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`, rateLimitResult.retryAfter);
        }
        // 6. Check quota
        const quotaCheck = await quotaService.checkQuota(authContext.userId);
        logger.logQuotaCheck({
            userId: authContext.userId,
            quotaUsed: quotaCheck.used,
            quotaLimit: quotaCheck.quota,
            allowed: quotaCheck.allowed,
            percentage: quotaCheck.percentage,
        });
        if (!quotaCheck.allowed) {
            throw new QuotaExceededError(quotaCheck.quota, quotaCheck.used, quotaCheck.resetDate || new Date().toISOString());
        }
        // 7. Generate PDF via Durable Objects (with fallback to SimpleBrowserService)
        const pdfGenStartTime = Date.now();
        let pdfResult;
        let usedDurableObjects = false;
        // Check if Durable Objects routing is enabled (feature flag)
        const doEnabled = isDurableObjectsEnabled(c.env);
        if (doEnabled && c.env.BROWSER_POOL_DO) {
            try {
                // Create Durable Object context for user routing
                const userId = extractUserIdForRouting(authContext);
                const doContext = createDurableObjectContext(userId, c.env.BROWSER_POOL_DO, doEnabled);
                logger.info('Routing PDF generation through Durable Objects', {
                    userId,
                    doId: doContext.doId,
                    requestId,
                });
                // Add userTier to options for R2 lifecycle tagging
                const optionsWithTier = {
                    ...options,
                    userTier: authContext.planTier || 'free',
                    userId: authContext.userId,
                };
                // Generate PDF through Durable Object
                const doResult = await generatePdfThroughDO(doContext, html, optionsWithTier);
                if (doResult.success && (doResult.pdf_url || doResult.pdfBuffer)) {
                    // Success! Use DO result
                    usedDurableObjects = true;
                    if (doResult.pdf_url) {
                        // DO returned PDF URL - R2 upload already handled
                        pdfResult = {
                            pdf_url: doResult.pdf_url,
                            expiresAt: doResult.expiresAt,
                            generationTime: doResult.generationTime || 0,
                            htmlHash: await hashHtmlContent(html),
                            htmlSize: new TextEncoder().encode(html).length,
                            pdfSize: doResult.size || 0, // Get size from DO response
                        };
                    }
                    else if (doResult.pdfBuffer) {
                        // DO returned buffer - need to upload to R2
                        pdfResult = {
                            pdfBuffer: doResult.pdfBuffer,
                            generationTime: doResult.generationTime || 0,
                            htmlHash: await hashHtmlContent(html),
                            htmlSize: new TextEncoder().encode(html).length,
                            pdfSize: doResult.pdfBuffer.byteLength,
                        };
                    }
                    logDurableObjectMetrics(doContext, doResult.generationTime || 0, logger);
                }
                else {
                    // DO failed - fall back to SimpleBrowserService
                    logger.warn('Durable Objects PDF generation failed, falling back to SimpleBrowserService', {
                        error: doResult.error,
                        requestId,
                    });
                    pdfResult = await pdfService.generatePdf(html, options, {
                        userId: authContext.userId,
                        apiKeyId: authContext.apiKeyId,
                        requestId,
                    });
                }
            }
            catch (doError) {
                // DO error - fall back to SimpleBrowserService
                logger.warn('Durable Objects error, falling back to SimpleBrowserService', {
                    error: doError instanceof Error ? doError.message : 'Unknown error',
                    requestId,
                });
                pdfResult = await pdfService.generatePdf(html, options, {
                    userId: authContext.userId,
                    apiKeyId: authContext.apiKeyId,
                    requestId,
                });
            }
        }
        else {
            // Durable Objects disabled or not available - use SimpleBrowserService
            logger.info('Using SimpleBrowserService (Durable Objects disabled or unavailable)', {
                requestId,
            });
            pdfResult = await pdfService.generatePdf(html, options, {
                userId: authContext.userId,
                apiKeyId: authContext.apiKeyId,
                requestId,
            });
        }
        const pdfGenTime = Date.now() - pdfGenStartTime;
        // Ensure pdfResult was populated
        if (!pdfResult) {
            throw new Error('PDF generation failed - no result returned');
        }
        // 8. Upload to R2 (if not already uploaded by Durable Object)
        let uploadResult;
        if (pdfResult.pdf_url) {
            // PDF already uploaded to R2 by Durable Object
            uploadResult = {
                url: pdfResult.pdf_url,
                expiresAt: pdfResult.expiresAt,
                size: pdfResult.pdfSize || 0,
                key: 'uploaded-by-do',
                etag: '',
            };
        }
        else if (pdfResult.pdfBuffer) {
            // Upload pdfBuffer to R2
            const fileName = generatePdfFileName();
            uploadResult = await uploadPdfToR2({
                bucket: c.env.PDF_STORAGE,
                content: pdfResult.pdfBuffer,
                fileName,
                userTier: authContext.planTier || 'free',
                metadata: {
                    userId: authContext.userId,
                    apiKeyId: authContext.apiKeyId,
                    requestId,
                },
            });
        }
        else {
            throw new Error('PDF generation failed - no URL or buffer returned');
        }
        // 9. Increment usage quota
        await quotaService.incrementUsage(authContext.userId);
        // 10. Log success
        logger.logPdfGeneration({
            generationTimeMs: pdfGenTime,
            htmlSizeBytes: pdfResult.htmlSize || 0,
            pdfSizeBytes: pdfResult.pdfSize || 0,
            userId: authContext.userId,
            apiKeyId: authContext.apiKeyId,
            apiKeyName: authContext.apiKeyName,
            requestId,
            format: options?.format,
            landscape: options?.orientation === 'landscape',
            success: true,
        });
        // 11. Return success response
        const totalTime = Date.now() - startTime;
        return c.json({
            success: true,
            data: {
                url: uploadResult.url,
                size: uploadResult.size,
                generationTime: pdfGenTime,
                expiresAt: uploadResult.expiresAt,
            },
            requestId,
        }, 200, {
            ...rateLimiter.getRateLimitHeaders(rateLimitResult),
        });
    }
    catch (error) {
        // Handle errors
        const totalTime = Date.now() - startTime;
        if (error instanceof UnauthorizedError) {
            logger.error('Unauthorized request', {
                error: error.message,
                requestId,
            });
            return c.json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: error.message,
                },
                requestId,
            }, 401);
        }
        if (error instanceof ValidationError) {
            logger.warn('Validation error', {
                error: error.message,
                details: error.details,
                requestId,
            });
            return c.json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.message,
                    details: error.details,
                },
                requestId,
            }, 400);
        }
        if (error instanceof QuotaExceededError) {
            logger.warn('Quota exceeded', {
                error: error.message,
                requestId,
            });
            return c.json({
                success: false,
                error: {
                    code: 'QUOTA_EXCEEDED',
                    message: error.message,
                    ...error.details,
                },
                requestId,
            }, 429);
        }
        if (error instanceof RateLimitExceededError) {
            logger.warn('Rate limit exceeded', {
                error: error.message,
                requestId,
            });
            return c.json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: error.message,
                },
                requestId,
            }, 429, {
                'Retry-After': error.details?.retryAfter?.toString() || '60',
            });
        }
        // Generic error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('PDF generation failed', {
            error: errorMessage,
            requestId,
            durationMs: totalTime,
        });
        return c.json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate PDF',
            },
            requestId,
        }, 500);
    }
});
export default app;
