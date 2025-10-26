/**
 * PDF Generator RPC Target
 *
 * Cap'n Web RpcTarget for WebSocket-based PDF generation.
 * Provides generatePdf and ping methods for high-volume clients.
 *
 * @packageDocumentation
 */

import { RpcTarget } from 'capnweb';
import type { PdfOptions, PdfResult } from '@speedstein/shared/types/pdf';
import { PdfService } from '../services/pdf.service';
import { AuthService } from '../services/auth.service';
import { QuotaService } from '../services/quota.service';
import { createLogger } from '../lib/logger';
import { generateRequestId } from '../lib/crypto';
import { uploadPdfToR2, generatePdfFileName } from '../lib/r2';
import type { BrowserPool } from '../lib/browser-pool';

/**
 * PDF generation job for batch processing
 */
export interface PdfJob {
  /** Unique job ID */
  id: string;

  /** HTML content to convert */
  html: string;

  /** PDF generation options */
  options?: PdfOptions;
}

/**
 * PDF generation batch result
 */
export interface PdfBatchResult {
  /** Job ID */
  id: string;

  /** Whether the generation succeeded */
  success: boolean;

  /** PDF result (if successful) */
  result?: PdfResult;

  /** Error message (if failed) */
  error?: string;
}

/**
 * Environment bindings for PdfGeneratorApi
 */
export interface PdfGeneratorEnv {
  /** Supabase URL */
  SUPABASE_URL: string;

  /** Supabase service role key */
  SUPABASE_SERVICE_KEY: string;

  /** R2 bucket binding */
  R2_BUCKET: R2Bucket;

  /** Browser rendering binding */
  BROWSER: Fetcher;
}

/**
 * PdfGeneratorApi RpcTarget
 *
 * Extends RpcTarget to provide WebSocket RPC methods for PDF generation.
 * Supports promise pipelining for high-throughput batch processing.
 *
 * @example
 * ```typescript
 * const api = new PdfGeneratorApi(env, browserPool, apiKey);
 *
 * // Single PDF generation
 * const result = await api.generatePdf(html, options);
 *
 * // Batch generation with promise pipelining
 * const jobs = [
 *   { id: '1', html: '<html>...</html>' },
 *   { id: '2', html: '<html>...</html>' },
 * ];
 * const results = await api.generateBatch(jobs);
 * ```
 */
export class PdfGeneratorApi extends RpcTarget {
  private pdfService: PdfService;
  private authService: AuthService;
  private quotaService: QuotaService;
  private env: PdfGeneratorEnv;
  private apiKey: string;
  private userId?: string;
  private heartbeatInterval?: number;

  constructor(env: PdfGeneratorEnv, browserPool: BrowserPool, apiKey: string) {
    super();

    this.env = env;
    this.apiKey = apiKey;

    // Initialize services
    // TODO: Fix type mismatch - PdfService expects SimpleBrowserService but RPC uses BrowserPool
    // This RPC code needs refactoring to work with the updated architecture
    this.pdfService = new PdfService(browserPool as any);
    this.authService = new AuthService(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    this.quotaService = new QuotaService(
      this.authService['supabase'] // Access private supabase client
    );

    // Start heartbeat (30s ping/pong)
    this.startHeartbeat();
  }

  /**
   * Start WebSocket heartbeat
   *
   * Sends ping every 30 seconds to keep connection alive.
   *
   * @private
   */
  private startHeartbeat(): void {
    // Heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.ping();
    }, 30000) as unknown as number;
  }

  /**
   * Stop heartbeat
   *
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * Authenticate the API key
   *
   * Validates the API key and retrieves user context.
   *
   * @private
   */
  private async authenticate(): Promise<void> {
    const authContext = await this.authService.validateApiKey(this.apiKey);
    this.userId = authContext.userId;
  }

  /**
   * Ping method for heartbeat
   *
   * @returns pong response
   */
  ping(): string {
    return 'pong';
  }

  /**
   * Generate a single PDF
   *
   * @param html - HTML content to convert
   * @param options - PDF generation options
   * @returns PDF generation result
   *
   * @example
   * ```typescript
   * const result = await api.generatePdf(
   *   '<html><body>Invoice</body></html>',
   *   { format: 'A4', landscape: false }
   * );
   * console.log(result.url); // https://cdn.speedstein.com/pdfs/...
   * ```
   */
  async generatePdf(html: string, options?: PdfOptions): Promise<PdfResult> {
    const requestId = generateRequestId();
    const logger = createLogger(requestId);

    try {
      // Authenticate API key
      if (!this.userId) {
        await this.authenticate();
      }

      logger.info('PDF generation requested', { userId: this.userId });

      // Check quota
      const quotaCheck = await this.quotaService.checkQuota(this.userId!);
      logger.logQuotaCheck({
        userId: this.userId!,
        quotaUsed: quotaCheck.used,
        quotaLimit: quotaCheck.quota,
        allowed: quotaCheck.allowed,
        percentage: quotaCheck.percentage,
      });

      if (!quotaCheck.allowed) {
        throw new Error('Quota exceeded');
      }

      // Generate PDF
      const startTime = Date.now();
      // TODO: Fix - generatePdf now returns PdfGenerationResult, not just buffer
      // RPC code needs refactoring to handle the new response structure
      const pdfResult = await this.pdfService.generatePdf(html, options, {
        userId: this.userId!,
        apiKeyId: '', // TODO: Get from auth context
        requestId,
      });
      const generationTime = Date.now() - startTime;

      // Upload to R2
      const fileName = generatePdfFileName();
      const uploadResult = await uploadPdfToR2({
        bucket: this.env.R2_BUCKET,
        content: pdfResult.pdfBuffer,
        fileName,
        metadata: {
          userId: this.userId!,
          requestId,
        },
      });

      // Increment usage
      await this.quotaService.incrementUsage(this.userId!);

      // Log success
      logger.logPdfGeneration({
        generationTimeMs: generationTime,
        htmlSizeBytes: pdfResult.htmlSize,
        pdfSizeBytes: pdfResult.pdfSize,
        userId: this.userId!,
        apiKeyId: '', // TODO: Get from auth context
        requestId,
        format: options?.format,
        landscape: false, // TODO: Extract from options properly
        success: true,
      });

      return {
        success: true,
        url: uploadResult.url,
        size: uploadResult.size,
        generationTime,
        expiresAt: uploadResult.expiresAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('PDF generation failed', {
        error: errorMessage,
        userId: this.userId,
      });

      throw error;
    }
  }

  /**
   * Generate multiple PDFs in batch
   *
   * Uses Promise.all for parallel processing with promise pipelining.
   * This enables high-throughput PDF generation (100+ PDFs/min).
   *
   * @param jobs - Array of PDF jobs
   * @returns Array of batch results
   *
   * @example
   * ```typescript
   * const jobs = [
   *   { id: '1', html: '<html>Invoice 1</html>' },
   *   { id: '2', html: '<html>Invoice 2</html>' },
   * ];
   * const results = await api.generateBatch(jobs);
   * results.forEach(r => {
   *   if (r.success) {
   *     console.log(`Job ${r.id}: ${r.result.url}`);
   *   } else {
   *     console.error(`Job ${r.id} failed: ${r.error}`);
   *   }
   * });
   * ```
   */
  async generateBatch(jobs: PdfJob[]): Promise<PdfBatchResult[]> {
    const logger = createLogger(generateRequestId(), this.userId);

    logger.info(`Batch generation requested`, {
      batchSize: jobs.length,
      userId: this.userId,
    });

    // Process all jobs in parallel
    const results = await Promise.all(
      jobs.map(async (job): Promise<PdfBatchResult> => {
        try {
          const result = await this.generatePdf(job.html, job.options);
          return {
            id: job.id,
            success: true,
            result,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            id: job.id,
            success: false,
            error: errorMessage,
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    logger.info(`Batch generation completed`, {
      total: jobs.length,
      successful: successCount,
      failed: jobs.length - successCount,
    });

    return results;
  }

  /**
   * Dispose resources when RpcTarget is cleaned up
   *
   * Implements Symbol.dispose for proper resource cleanup.
   * Stops heartbeat and releases resources.
   *
   * @internal
   */
  [Symbol.dispose](): void {
    this.stopHeartbeat();
  }
}

/**
 * Create PdfGeneratorApi instance
 *
 * Factory function for creating PdfGeneratorApi instances.
 *
 * @param env - Environment bindings
 * @param browserPool - Browser pool instance
 * @param apiKey - API key for authentication
 * @returns PdfGeneratorApi instance
 */
export function createPdfGeneratorApi(
  env: PdfGeneratorEnv,
  browserPool: BrowserPool,
  apiKey: string
): PdfGeneratorApi {
  return new PdfGeneratorApi(env, browserPool, apiKey);
}
