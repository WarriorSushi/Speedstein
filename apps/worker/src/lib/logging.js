/**
 * Structured Logging Utility
 * Phase 2: Foundational (T025)
 * Provides JSON-formatted logging for Cloudflare Workers
 */
/**
 * Create a structured log entry
 */
function createLogEntry(level, message, context, error) {
    const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
    };
    if (context) {
        entry.context = context;
    }
    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }
    return entry;
}
/**
 * Write log entry to console
 */
function writeLog(entry) {
    const logString = JSON.stringify(entry);
    switch (entry.level) {
        case 'debug':
            console.debug(logString);
            break;
        case 'info':
            console.info(logString);
            break;
        case 'warn':
            console.warn(logString);
            break;
        case 'error':
        case 'fatal':
            console.error(logString);
            break;
    }
}
/**
 * Log debug message
 */
export function logDebug(message, context) {
    const entry = createLogEntry('debug', message, context);
    writeLog(entry);
}
/**
 * Log info message
 */
export function logInfo(message, context) {
    const entry = createLogEntry('info', message, context);
    writeLog(entry);
}
/**
 * Log warning message
 */
export function logWarn(message, context) {
    const entry = createLogEntry('warn', message, context);
    writeLog(entry);
}
/**
 * Log error message
 */
export function logError(message, error, context) {
    const entry = createLogEntry('error', message, context, error);
    writeLog(entry);
}
/**
 * Log fatal error message
 */
export function logFatal(message, error, context) {
    const entry = createLogEntry('fatal', message, context, error);
    writeLog(entry);
}
/**
 * Create a logger with pre-filled context
 */
export class Logger {
    defaultContext;
    constructor(defaultContext = {}) {
        this.defaultContext = defaultContext;
    }
    debug(message, context) {
        logDebug(message, { ...this.defaultContext, ...context });
    }
    info(message, context) {
        logInfo(message, { ...this.defaultContext, ...context });
    }
    warn(message, context) {
        logWarn(message, { ...this.defaultContext, ...context });
    }
    error(message, error, context) {
        logError(message, error, { ...this.defaultContext, ...context });
    }
    fatal(message, error, context) {
        logFatal(message, error, { ...this.defaultContext, ...context });
    }
    /**
     * Create a child logger with additional context
     */
    child(additionalContext) {
        return new Logger({ ...this.defaultContext, ...additionalContext });
    }
}
/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId, context) {
    return new Logger({ requestId, ...context });
}
