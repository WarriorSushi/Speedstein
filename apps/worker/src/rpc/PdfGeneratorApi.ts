/**
 * PDF Generator RPC API
 *
 * Cap'n Web RPC target for WebSocket-based PDF generation.
 * Extends RpcTarget to enable promise pipelining for batch operations.
 *
 * Performance targets:
 * - 100+ PDFs/min throughput via promise pipelining
 * - <2s P95 latency per PDF
 * - Browser session reuse via Durable Objects
 */

import { RpcTarget } from 'capnweb';
import type { Browser } from '@cloudflare/puppeteer';
import type { PdfOptions, PdfResult } from '../types/durable-objects';
import {
  validatePdfOptions,
  validatePdfGenerationRequest,
  PdfGenerationRequestSchema,
} from '../lib/validation';
import { getDOStubForUser } from '../lib/browser-pool-manager';

/**
 * PDF generation job for batch operations
 */
export interface PdfJob {
  id: string;
  html: string;
  options?: PdfOptions;
}

/**
 * Batch result with individual job results
 */
export interface BatchResult {
  success: boolean;
  results: PdfResult[];
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  totalTime: number;
}

/**
 * PDF Generator RPC API
 *
 * Implements Cap'n Web RpcTarget for WebSocket-based PDF generation.
 * All methods are exposed as RPC endpoints automatically.
 */
/**
 * RPC session metadata
 */
export interface RpcSessionMetadata {
  sessionId: string;
  userId: string;
  connectionType: 'websocket' | 'http-batch';
  createdAt: Date;
  lastActivityAt: Date;
  requestCount: number;
  isActive: boolean;
}

export class PdfGeneratorApi extends RpcTarget {
  private userId: string;
  private browserPoolNamespace: DurableObjectNamespace;
  private sessionId: string;
  private requestCount: number = 0;
  private sessionMetadata: RpcSessionMetadata;

  constructor(
    userId: string,
    browserPoolNamespace: DurableObjectNamespace,
    sessionId: string,
    connectionType: 'websocket' | 'http-batch' = 'websocket'
  ) {
    super();
    this.userId = userId;
    this.browserPoolNamespace = browserPoolNamespace;
    this.sessionId = sessionId;

    // Initialize session metadata
    this.sessionMetadata = {
      sessionId,
      userId,
      connectionType,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      requestCount: 0,
      isActive: true,
    };
  }

  /**
   * Generate a single PDF from HTML content
   *
   * @param html - HTML content to convert to PDF
   * @param options - Puppeteer PDF options
   * @returns Promise<PdfResult> with pdfBuffer and metadata
   */
  async generatePdf(html: string, options?: PdfOptions): Promise<PdfResult> {
    this.requestCount++;
    this.sessionMetadata.requestCount++;
    this.sessionMetadata.lastActivityAt = new Date();
    const startTime = Date.now();

    try {
      // Validate input parameters
      const validation = validatePdfGenerationRequest({ html, options });
      if (!validation.success) {
        console.error('PDF generation validation failed:', validation.error.errors);
        return {
          success: false,
          error: `Validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`,
          generationTime: 0,
          requestId: `rpc-${this.sessionId}-${Date.now()}`,
        };
      }

      console.log(`[RPC ${this.sessionId}] generatePdf request #${this.requestCount} for user ${this.userId}`);

      // Get Durable Object stub for this user
      const doStub = getDOStubForUser(this.userId, this.browserPoolNamespace);

      // Create request to Durable Object
      const request = new Request('https://fake-host/generate?action=generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, options: options || {} }),
      });

      // Forward to Durable Object browser pool
      const response = await doStub.fetch(request);
      const result = (await response.json()) as {
        success: boolean;
        pdf_url?: string;
        expiresAt?: string;
        pdfBuffer?: number[];
        generationTime?: number;
        error?: string;
      };

      const generationTime = Date.now() - startTime;
      const requestId = `rpc-${this.sessionId}-${Date.now()}`;

      if (!response.ok) {
        console.error(
          `[RPC ${this.sessionId}] PDF generation failed: ${result.error || 'Unknown error'}`
        );
        return {
          success: false,
          error: result.error || `HTTP ${response.status}`,
          generationTime,
          requestId,
        };
      }

      console.log(
        `[RPC ${this.sessionId}] PDF generated successfully in ${result.generationTime}ms (total: ${generationTime}ms)`
      );

      return {
        success: true,
        pdfUrl: result.pdf_url || '', // Return R2 URL if available
        expiresAt: result.expiresAt,
        generationTime: result.generationTime || generationTime,
        requestId,
      };
    } catch (error) {
      const generationTime = Date.now() - startTime;
      console.error(`[RPC ${this.sessionId}] generatePdf error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime,
        requestId: `rpc-${this.sessionId}-${Date.now()}`,
      };
    }
  }

  /**
   * Generate multiple PDFs in batch with promise pipelining
   *
   * Uses Promise.all for concurrent processing, leveraging Cap'n Web
   * promise pipelining to minimize network round trips.
   *
   * @param jobs - Array of PDF generation jobs with unique IDs
   * @returns Promise<BatchResult> with individual job results
   */
  async generateBatch(jobs: PdfJob[]): Promise<BatchResult> {
    const startTime = Date.now();
    this.requestCount += jobs.length;
    this.sessionMetadata.requestCount += jobs.length;
    this.sessionMetadata.lastActivityAt = new Date();

    try {
      console.log(
        `[RPC ${this.sessionId}] generateBatch request with ${jobs.length} jobs for user ${this.userId}`
      );

      // Validate jobs array
      if (!Array.isArray(jobs) || jobs.length === 0) {
        return {
          success: false,
          results: [],
          totalJobs: 0,
          successfulJobs: 0,
          failedJobs: 0,
          totalTime: Date.now() - startTime,
        };
      }

      // Process all jobs concurrently using Promise.all
      // Cap'n Web promise pipelining optimizes network round trips
      const resultsPromises = jobs.map((job) =>
        this.generatePdf(job.html, job.options).then((result) => ({
          ...result,
          fileName: job.id,
        }))
      );

      const results = await Promise.all(resultsPromises);

      const successfulJobs = results.filter((r) => r.success).length;
      const failedJobs = results.filter((r) => !r.success).length;
      const totalTime = Date.now() - startTime;

      console.log(
        `[RPC ${this.sessionId}] Batch complete: ${successfulJobs}/${jobs.length} successful in ${totalTime}ms (${Math.round((jobs.length / totalTime) * 60000)} PDFs/min)`
      );

      return {
        success: true,
        results,
        totalJobs: jobs.length,
        successfulJobs,
        failedJobs,
        totalTime,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[RPC ${this.sessionId}] generateBatch error:`, error);
      return {
        success: false,
        results: [],
        totalJobs: jobs.length,
        successfulJobs: 0,
        failedJobs: jobs.length,
        totalTime,
      };
    }
  }

  /**
   * Ping method for WebSocket keepalive
   * @returns Promise<string> - "pong"
   */
  async ping(): Promise<string> {
    return 'pong';
  }

  /**
   * Get session statistics and metadata
   * @returns Full session metadata
   */
  async getStats(): Promise<RpcSessionMetadata> {
    return {
      ...this.sessionMetadata,
      requestCount: this.requestCount, // Use latest count
    };
  }

  /**
   * Resource cleanup using Symbol.dispose
   * Called automatically when RPC session ends
   */
  [Symbol.dispose](): void {
    this.sessionMetadata.isActive = false;
    this.sessionMetadata.lastActivityAt = new Date();

    console.log(
      `[RPC ${this.sessionId}] Disposing PdfGeneratorApi for user ${this.userId} (${this.requestCount} requests, duration: ${Date.now() - this.sessionMetadata.createdAt.getTime()}ms)`
    );
    // Cleanup resources if needed
    // Browser instances are managed by Durable Objects, no cleanup needed here
  }
}
