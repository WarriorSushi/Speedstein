/**
 * Cap'n Web RPC Type Definitions
 *
 * TypeScript types for the PDF Generator RPC API using Cap'n Web protocol.
 * Supports both WebSocket and HTTP Batch transports with promise pipelining.
 */

// ============================================================================
// RPC REQUEST TYPES
// ============================================================================

/**
 * Single PDF generation request via RPC
 * (FR-006: RPC method signature)
 */
export interface RpcGeneratePdfRequest {
  /** HTML content to render as PDF */
  html: string;

  /** Optional PDF generation options */
  options?: RpcPdfOptions;

  /** Optional metadata for the PDF */
  metadata?: Record<string, string>;
}

/**
 * Batch PDF generation request via RPC with promise pipelining
 * (FR-007: Batch generation support)
 */
export interface RpcBatchGeneratePdfRequest {
  /** Array of PDF generation requests */
  pdfs: RpcGeneratePdfRequest[];

  /** Optional batch-level options */
  batchOptions?: {
    /** Fail entire batch if any PDF fails (default: false) */
    failFast?: boolean;

    /** Maximum concurrent PDFs to generate (default: 10) */
    maxConcurrency?: number;
  };
}

/**
 * PDF generation options for RPC requests
 */
export interface RpcPdfOptions {
  /** Paper format (default: 'A4') */
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';

  /** Print background graphics (default: true) */
  printBackground?: boolean;

  /** Page margins */
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };

  /** Landscape orientation (default: false) */
  landscape?: boolean;

  /** Page ranges to print (e.g., '1-5, 8, 11-13') */
  pageRanges?: string;

  /** Display header and footer (default: false) */
  displayHeaderFooter?: boolean;

  /** HTML template for header */
  headerTemplate?: string;

  /** HTML template for footer */
  footerTemplate?: string;

  /** Prefer CSS page size (default: false) */
  preferCSSPageSize?: boolean;

  /** Scale of the webpage rendering (default: 1.0) */
  scale?: number;
}

// ============================================================================
// RPC RESPONSE TYPES
// ============================================================================

/**
 * Single PDF generation response via RPC
 * (FR-008: Response structure)
 */
export interface RpcGeneratePdfResponse {
  /** Success status */
  success: true;

  /** PDF data */
  data: {
    /** R2 URL to the generated PDF */
    url: string;

    /** PDF file size in bytes */
    size: number;

    /** Generation time in milliseconds */
    generationTime: number;

    /** Expiration timestamp (ISO 8601) */
    expiresAt: string;

    /** Unique PDF ID */
    pdfId: string;
  };
}

/**
 * Batch PDF generation response via RPC
 * (FR-009: Batch response structure)
 */
export interface RpcBatchGeneratePdfResponse {
  /** Success status */
  success: true;

  /** Batch results */
  data: {
    /** Successfully generated PDFs */
    results: RpcGeneratePdfResponse['data'][];

    /** Failed PDFs (if any) */
    errors: RpcPdfGenerationError[];

    /** Total batch processing time in milliseconds */
    totalTime: number;

    /** Number of successful PDFs */
    successCount: number;

    /** Number of failed PDFs */
    errorCount: number;
  };
}

/**
 * Error response for failed PDF generation
 * (FR-010: Error handling)
 */
export interface RpcPdfGenerationError {
  /** Error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Optional error details */
  details?: Record<string, unknown>;

  /** Index in batch (for batch operations) */
  index?: number;
}

/**
 * RPC error response
 */
export interface RpcErrorResponse {
  /** Success status (always false for errors) */
  success: false;

  /** Error details */
  error: RpcPdfGenerationError;
}

// ============================================================================
// RPC API INTERFACE
// ============================================================================

/**
 * PDF Generator RPC API interface
 * (FR-011: Cap'n Web RpcTarget interface)
 *
 * This interface defines the methods exposed via Cap'n Web RPC.
 * The implementation will extend `RpcTarget` from the `capnweb` package.
 */
export interface IPdfGeneratorApi {
  /**
   * Generate a single PDF from HTML
   *
   * @param request - PDF generation request
   * @returns Promise resolving to PDF response
   */
  generatePdf(
    request: RpcGeneratePdfRequest
  ): Promise<RpcGeneratePdfResponse | RpcErrorResponse>;

  /**
   * Generate multiple PDFs in batch using promise pipelining
   *
   * @param request - Batch PDF generation request
   * @returns Promise resolving to batch response
   */
  batchGeneratePdf(
    request: RpcBatchGeneratePdfRequest
  ): Promise<RpcBatchGeneratePdfResponse | RpcErrorResponse>;

  /**
   * Health check for RPC connection
   *
   * @returns Promise resolving to health status
   */
  healthCheck(): Promise<{ status: 'healthy'; timestamp: string }>;
}

// ============================================================================
// RPC CLIENT TYPES
// ============================================================================

/**
 * RPC client configuration options
 */
export interface RpcClientOptions {
  /** API endpoint URL (WebSocket or HTTP) */
  endpoint: string;

  /** API key for authentication */
  apiKey: string;

  /** Transport protocol (default: auto-detect) */
  transport?: 'websocket' | 'http' | 'auto';

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable automatic reconnection for WebSocket (default: true) */
  autoReconnect?: boolean;

  /** Maximum reconnection attempts (default: 3) */
  maxReconnectAttempts?: number;
}

/**
 * RPC connection state
 */
export type RpcConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

/**
 * RPC client event types
 */
export interface RpcClientEvents {
  stateChange: (state: RpcConnectionState) => void;
  error: (error: Error) => void;
  reconnect: (attempt: number) => void;
}

// ============================================================================
// BROWSER POOL RPC TYPES
// ============================================================================

/**
 * Browser pool statistics exposed via RPC
 * (FR-005: Monitoring and health checks)
 */
export interface BrowserPoolStats {
  /** Total browsers in pool */
  totalBrowsers: number;

  /** Active browser sessions */
  activeSessions: number;

  /** Idle browser sessions */
  idleSessions: number;

  /** Browser reuse rate (0-1) */
  reuseRate: number;

  /** Average session duration in milliseconds */
  avgSessionDuration: number;

  /** Total PDFs generated */
  totalPdfsGenerated: number;

  /** Pool uptime in milliseconds */
  poolUptime: number;

  /** Current load (0-1) */
  currentLoad: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for RPC error response
 */
export function isRpcError(
  response: RpcGeneratePdfResponse | RpcErrorResponse
): response is RpcErrorResponse {
  return response.success === false;
}

/**
 * Type guard for single PDF response
 */
export function isRpcPdfResponse(
  response: RpcGeneratePdfResponse | RpcErrorResponse
): response is RpcGeneratePdfResponse {
  return response.success === true;
}

/**
 * Type guard for batch PDF response
 */
export function isRpcBatchResponse(
  response: RpcBatchGeneratePdfResponse | RpcErrorResponse
): response is RpcBatchGeneratePdfResponse {
  return response.success === true && 'results' in response.data;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Promise pipelining context for batched operations
 */
export interface PipelineContext {
  /** Batch ID for tracking */
  batchId: string;

  /** Total requests in batch */
  totalRequests: number;

  /** Completed requests */
  completedRequests: number;

  /** Start timestamp */
  startTime: number;
}

/**
 * RPC method metadata for logging and monitoring
 */
export interface RpcMethodMetadata {
  /** Method name */
  method: string;

  /** Request timestamp */
  timestamp: string;

  /** API key hash (for logging) */
  apiKeyHash: string;

  /** Browser session ID (if using pooling) */
  sessionId?: string;

  /** Durable Object ID (if applicable) */
  durableObjectId?: string;
}
