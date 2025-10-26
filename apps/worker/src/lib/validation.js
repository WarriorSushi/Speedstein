/**
 * Zod Validation Schemas
 *
 * Type-safe validation schemas for API requests, Durable Object state,
 * and internal data structures using Zod.
 */
import { z } from 'zod';
/**
 * Browser instance status
 */
export const BrowserStatusSchema = z.enum(['active', 'idle', 'crashed']);
/**
 * Browser instance schema
 */
export const BrowserInstanceSchema = z.object({
    instanceId: z.string().min(1),
    browserHandle: z.any().nullable(), // Browser object cannot be validated by Zod
    createdAt: z.date(),
    pdfsGenerated: z.number().int().nonnegative(),
    lastUsedAt: z.date(),
    memoryUsage: z.number().nonnegative(),
    status: BrowserStatusSchema,
});
/**
 * Queued request schema
 */
export const QueuedRequestSchema = z.object({
    requestId: z.string().min(1),
    html: z.string().min(1),
    options: z.any(), // PdfOptions - validated separately
    queuedAt: z.date(),
    userId: z.string().optional(),
});
/**
 * Browser pool state schema
 */
export const BrowserPoolStateSchema = z.object({
    objectId: z.string().min(1),
    browserInstances: z.array(BrowserInstanceSchema),
    requestQueue: z.array(QueuedRequestSchema),
    createdAt: z.date(),
    lastActivityAt: z.date(),
    totalPdfsGenerated: z.number().int().nonnegative(),
    currentLoad: z.number().int().nonnegative(),
});
/**
 * PDF margin schema
 */
export const PdfMarginSchema = z
    .object({
    top: z.string().optional(),
    right: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
})
    .optional();
/**
 * PDF options schema (Puppeteer PDFOptions)
 */
export const PdfOptionsSchema = z.object({
    // Page properties
    format: z
        .enum(['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'])
        .optional(),
    width: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
    scale: z.number().min(0.1).max(2).optional(),
    landscape: z.boolean().optional(),
    // Layout
    displayHeaderFooter: z.boolean().optional(),
    headerTemplate: z.string().optional(),
    footerTemplate: z.string().optional(),
    printBackground: z.boolean().optional(),
    margin: PdfMarginSchema,
    // Page ranges
    pageRanges: z.string().optional(),
    // Other options
    preferCSSPageSize: z.boolean().optional(),
    omitBackground: z.boolean().optional(),
    timeout: z.number().int().positive().optional(),
    tagged: z.boolean().optional(),
});
/**
 * PDF generation request schema (API input)
 */
export const PdfGenerationRequestSchema = z.object({
    html: z.string().min(1, 'HTML content is required'),
    options: PdfOptionsSchema.optional(),
    userId: z.string().optional(),
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional(),
});
/**
 * RPC session metadata schema
 */
export const RpcSessionMetadataSchema = z.object({
    sessionId: z.string().min(1),
    userId: z.string(),
    createdAt: z.date(),
    lastActivityAt: z.date(),
    requestCount: z.number().int().nonnegative(),
    isActive: z.boolean(),
});
/**
 * PDF result schema
 */
export const PdfResultSchema = z.object({
    success: z.boolean(),
    pdfBuffer: z.instanceof(Uint8Array).optional(),
    pdfUrl: z.string().url().optional(),
    generationTime: z.number().nonnegative().optional(),
    error: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().int().nonnegative().optional(),
});
/**
 * Health check response schema
 */
export const HealthCheckSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    objectId: z.string().optional(),
    activeBrowsers: z.number().int().nonnegative().optional(),
    totalPdfsGenerated: z.number().int().nonnegative().optional(),
    currentLoad: z.number().int().nonnegative().optional(),
    timestamp: z.string().datetime().optional(),
});
/**
 * API key validation schema
 */
export const ApiKeySchema = z.object({
    key: z.string().min(32).max(128),
    userId: z.string().uuid(),
    name: z.string().min(1).max(255).optional(),
});
/**
 * Rate limit info schema
 */
export const RateLimitInfoSchema = z.object({
    limit: z.number().int().positive(),
    remaining: z.number().int().nonnegative(),
    reset: z.number().int().positive(), // Unix timestamp
    retryAfter: z.number().int().nonnegative().optional(),
});
/**
 * Validation helper functions
 */
/**
 * Validate browser pool state
 */
export function validateBrowserPoolState(data) {
    return BrowserPoolStateSchema.safeParse(data);
}
/**
 * Validate PDF options
 */
export function validatePdfOptions(data) {
    return PdfOptionsSchema.safeParse(data);
}
/**
 * Validate PDF generation request
 */
export function validatePdfGenerationRequest(data) {
    return PdfGenerationRequestSchema.safeParse(data);
}
/**
 * Validate API key
 */
export function validateApiKey(data) {
    return ApiKeySchema.safeParse(data);
}
