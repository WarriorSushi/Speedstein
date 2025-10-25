/**
 * PDF generation types
 *
 * Defines types for PDF generation options and results
 * Used across both frontend (Next.js) and backend (Cloudflare Worker)
 *
 * @packageDocumentation
 */

/**
 * Page format options supported by Speedstein
 * Based on common PDF paper sizes
 */
export type PageFormat = 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';

/**
 * Page orientation options
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Margin specification for PDF pages
 * All values must be valid CSS length strings (e.g., '1cm', '10mm', '0.5in')
 */
export interface PdfMargin {
  /** Top margin (e.g., '1cm', '10mm') */
  top?: string;
  /** Right margin */
  right?: string;
  /** Bottom margin */
  bottom?: string;
  /** Left margin */
  left?: string;
}

/**
 * Options for PDF generation
 *
 * These options control the appearance and formatting of generated PDFs.
 * All options are optional; defaults will be applied by the PDF service.
 *
 * @example
 * ```typescript
 * const options: PdfOptions = {
 *   format: 'A4',
 *   orientation: 'portrait',
 *   margin: {
 *     top: '1cm',
 *     right: '1cm',
 *     bottom: '1cm',
 *     left: '1cm',
 *   },
 *   printBackground: true,
 * };
 * ```
 */
export interface PdfOptions {
  /**
   * Page format
   * @default 'A4'
   */
  format?: PageFormat;

  /**
   * Page orientation
   * @default 'portrait'
   */
  orientation?: PageOrientation;

  /**
   * Whether to print background graphics
   * @default true
   */
  printBackground?: boolean;

  /**
   * Page margins
   * @default undefined (uses browser defaults)
   */
  margin?: PdfMargin;

  /**
   * Scale factor for rendering (0.1 to 2.0)
   * @default 1.0
   */
  scale?: number;

  /**
   * Whether to display header and footer
   * @default false
   */
  displayHeaderFooter?: boolean;

  /**
   * HTML template for page header
   * Only used if displayHeaderFooter is true
   * Supports special span classes: date, title, url, pageNumber, totalPages
   * @default undefined
   */
  headerTemplate?: string;

  /**
   * HTML template for page footer
   * Only used if displayHeaderFooter is true
   * Supports special span classes: date, title, url, pageNumber, totalPages
   * @default undefined
   * @example
   * ```html
   * <div style="font-size:10px;text-align:center;">
   *   Page <span class="pageNumber"></span> of <span class="totalPages"></span>
   * </div>
   * ```
   */
  footerTemplate?: string;

  /**
   * Whether to prefer @page CSS size over format option
   * If true, CSS @page rules take precedence
   * @default false
   */
  preferCSSPageSize?: boolean;
}

/**
 * Request payload for PDF generation API
 */
export interface GeneratePdfRequest {
  /** HTML content to convert to PDF (max 10MB) */
  html: string;

  /** Optional PDF generation options */
  options?: PdfOptions;
}

/**
 * Successful PDF generation result
 */
export interface PdfResult {
  /** Success indicator */
  success: true;

  /** Public URL to the generated PDF (Cloudflare R2) */
  url: string;

  /** Time taken to generate PDF in milliseconds */
  generationTime: number;

  /** Size of generated PDF in bytes */
  size: number;

  /** ISO 8601 timestamp when PDF expires (30 days from creation) */
  expiresAt: string;
}

/**
 * PDF generation metadata (for internal use and logging)
 */
export interface PdfMetadata {
  /** Unique ID for this generation request */
  requestId: string;

  /** User ID who requested the PDF */
  userId: string;

  /** API key ID used for authentication */
  apiKeyId: string;

  /** SHA-256 hash of HTML content (for deduplication) */
  htmlHash: string;

  /** Size of input HTML in bytes */
  htmlSize: number;

  /** Size of output PDF in bytes */
  pdfSize: number;

  /** Generation time in milliseconds */
  generationTime: number;

  /** Timestamp of generation */
  createdAt: Date;
}

/**
 * Quota information
 */
export interface QuotaInfo {
  /** Total quota for current billing period */
  quota: number;

  /** PDFs generated so far in current period */
  used: number;

  /** Remaining quota */
  remaining: number;

  /** Percentage used (0-100+) */
  percentage: number;

  /** ISO 8601 timestamp when quota resets */
  resetDate: string;
}

/**
 * Rate limit headers included in API responses
 */
export interface RateLimitHeaders {
  /** Total quota for billing period */
  'X-RateLimit-Limit': number;

  /** Remaining quota */
  'X-RateLimit-Remaining': number;

  /** Unix timestamp when quota resets */
  'X-RateLimit-Reset': number;

  /** PDFs generated so far */
  'X-RateLimit-Used': number;
}

/**
 * Default PDF options used when none are specified
 */
export const DEFAULT_PDF_OPTIONS: Required<Omit<PdfOptions, 'margin' | 'headerTemplate' | 'footerTemplate'>> = {
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
