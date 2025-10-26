/**
 * Structured Logging Utilities
 *
 * Provides structured logging for PDF generation and API requests.
 * Logs are formatted as JSON for easy parsing by Cloudflare Workers analytics.
 *
 * @packageDocumentation
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Base log entry structure
 */
interface BaseLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
}

/**
 * PDF generation log entry
 */
export interface PdfGenerationLog extends BaseLogEntry {
  event: 'pdf_generation';
  generationTimeMs: number;
  htmlSizeBytes: number;
  pdfSizeBytes: number;
  userId: string;
  apiKeyId: string;
  apiKeyName?: string;
  requestId: string;
  format?: string;
  landscape?: boolean;
  success: boolean;
  error?: string;
}

/**
 * API request log entry
 */
export interface ApiRequestLog extends BaseLogEntry {
  event: 'api_request';
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  apiKeyId?: string;
  requestId: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Authentication log entry
 */
export interface AuthLog extends BaseLogEntry {
  event: 'auth';
  success: boolean;
  apiKeyPrefix?: string;
  userId?: string;
  error?: string;
}

/**
 * Quota check log entry
 */
export interface QuotaLog extends BaseLogEntry {
  event: 'quota_check';
  userId: string;
  quotaUsed: number;
  quotaLimit: number;
  allowed: boolean;
  percentage: number;
}

/**
 * Rate limit log entry
 */
export interface RateLimitLog extends BaseLogEntry {
  event: 'rate_limit';
  identifier: string;
  allowed: boolean;
  currentCount: number;
  limit: number;
  retryAfter?: number;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private requestId: string;
  private userId?: string;

  constructor(requestId: string, userId?: string) {
    this.requestId = requestId;
    this.userId = userId;
  }

  /**
   * Log a message with structured data
   *
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional structured data
   */
  private log(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
    const logEntry: BaseLogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      ...data,
    };

    // Output as JSON for structured logging
    const logOutput = JSON.stringify(logEntry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logOutput);
        break;
      case LogLevel.INFO:
        console.log(logOutput);
        break;
      case LogLevel.WARN:
        console.warn(logOutput);
        break;
      case LogLevel.ERROR:
        console.error(logOutput);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  error(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Log PDF generation event
   *
   * @param data - PDF generation data
   *
   * @example
   * ```typescript
   * logger.logPdfGeneration({
   *   generationTimeMs: 1234,
   *   htmlSizeBytes: 5000,
   *   pdfSizeBytes: 50000,
   *   userId: 'user_123',
   *   apiKeyId: 'key_456',
   *   success: true,
   * });
   * ```
   */
  logPdfGeneration(data: Omit<PdfGenerationLog, 'level' | 'message' | 'timestamp' | 'event'>): void {
    this.log(LogLevel.INFO, `PDF generated in ${data.generationTimeMs}ms`, {
      event: 'pdf_generation',
      ...data,
    });
  }

  /**
   * Log API request
   *
   * @param data - API request data
   */
  logApiRequest(data: Omit<ApiRequestLog, 'level' | 'message' | 'timestamp' | 'event'>): void {
    this.log(
      LogLevel.INFO,
      `${data.method} ${data.path} - ${data.statusCode} (${data.durationMs}ms)`,
      {
        event: 'api_request',
        ...data,
      }
    );
  }

  /**
   * Log authentication attempt
   *
   * @param data - Auth data
   */
  logAuth(data: Omit<AuthLog, 'level' | 'message' | 'timestamp' | 'event'>): void {
    const message = data.success ? 'Authentication successful' : 'Authentication failed';
    this.log(data.success ? LogLevel.INFO : LogLevel.WARN, message, {
      event: 'auth',
      ...data,
    });
  }

  /**
   * Log quota check
   *
   * @param data - Quota check data
   */
  logQuotaCheck(data: Omit<QuotaLog, 'level' | 'message' | 'timestamp' | 'event'>): void {
    const message = data.allowed
      ? `Quota check passed (${data.percentage}%)`
      : 'Quota exceeded';
    this.log(data.allowed ? LogLevel.INFO : LogLevel.WARN, message, {
      event: 'quota_check',
      ...data,
    });
  }

  /**
   * Log rate limit check
   *
   * @param data - Rate limit data
   */
  logRateLimit(data: Omit<RateLimitLog, 'level' | 'message' | 'timestamp' | 'event'>): void {
    const message = data.allowed
      ? `Rate limit check passed (${data.currentCount}/${data.limit})`
      : `Rate limit exceeded (${data.currentCount}/${data.limit})`;
    this.log(data.allowed ? LogLevel.INFO : LogLevel.WARN, message, {
      event: 'rate_limit',
      ...data,
    });
  }
}

/**
 * Create a logger instance
 *
 * @param requestId - Unique request ID for correlation
 * @param userId - Optional user ID
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('req_abc123', 'user_456');
 * logger.info('Request started');
 * ```
 */
export function createLogger(requestId: string, userId?: string): Logger {
  return new Logger(requestId, userId);
}
