/**
 * PDF generation types
 *
 * Defines types for PDF generation options and results
 * Used across both frontend (Next.js) and backend (Cloudflare Worker)
 *
 * @packageDocumentation
 */
/**
 * Default PDF options used when none are specified
 */
export const DEFAULT_PDF_OPTIONS = {
    format: 'A4',
    orientation: 'portrait',
    printBackground: true,
    scale: 1.0,
    displayHeaderFooter: false,
    preferCSSPageSize: false,
};
/**
 * Maximum allowed HTML payload size (10MB)
 */
export const MAX_HTML_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
/**
 * PDF generation timeout (10 seconds)
 */
export const PDF_GENERATION_TIMEOUT_MS = 10 * 1000;
/**
 * PDF expiration time (30 days)
 */
export const PDF_EXPIRATION_DAYS = 30;
