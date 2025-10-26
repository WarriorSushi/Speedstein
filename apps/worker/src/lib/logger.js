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
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
/**
 * Logger class for structured logging
 */
export class Logger {
    requestId;
    userId;
    constructor(requestId, userId) {
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
    log(level, message, data = {}) {
        const logEntry = {
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
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    /**
     * Log info message
     */
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    /**
     * Log warning message
     */
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    /**
     * Log error message
     */
    error(message, data) {
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
    logPdfGeneration(data) {
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
    logApiRequest(data) {
        this.log(LogLevel.INFO, `${data.method} ${data.path} - ${data.statusCode} (${data.durationMs}ms)`, {
            event: 'api_request',
            ...data,
        });
    }
    /**
     * Log authentication attempt
     *
     * @param data - Auth data
     */
    logAuth(data) {
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
    logQuotaCheck(data) {
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
    logRateLimit(data) {
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
export function createLogger(requestId, userId) {
    return new Logger(requestId, userId);
}
