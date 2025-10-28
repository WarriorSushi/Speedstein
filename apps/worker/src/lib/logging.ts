/**
 * Structured Logging Utility
 * Phase 2: Foundational (T025)
 * Provides JSON-formatted logging for Cloudflare Workers
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  apiKeyId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
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
function writeLog(entry: LogEntry) {
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
export function logDebug(message: string, context?: LogContext) {
  const entry = createLogEntry('debug', message, context);
  writeLog(entry);
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext) {
  const entry = createLogEntry('info', message, context);
  writeLog(entry);
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: LogContext) {
  const entry = createLogEntry('warn', message, context);
  writeLog(entry);
}

/**
 * Log error message
 */
export function logError(message: string, error?: Error, context?: LogContext) {
  const entry = createLogEntry('error', message, context, error);
  writeLog(entry);
}

/**
 * Log fatal error message
 */
export function logFatal(message: string, error?: Error, context?: LogContext) {
  const entry = createLogEntry('fatal', message, context, error);
  writeLog(entry);
}

/**
 * Create a logger with pre-filled context
 */
export class Logger {
  constructor(private defaultContext: LogContext = {}) {}

  debug(message: string, context?: LogContext) {
    logDebug(message, { ...this.defaultContext, ...context });
  }

  info(message: string, context?: LogContext) {
    logInfo(message, { ...this.defaultContext, ...context });
  }

  warn(message: string, context?: LogContext) {
    logWarn(message, { ...this.defaultContext, ...context });
  }

  error(message: string, error?: Error, context?: LogContext) {
    logError(message, error, { ...this.defaultContext, ...context });
  }

  fatal(message: string, error?: Error, context?: LogContext) {
    logFatal(message, error, { ...this.defaultContext, ...context });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.defaultContext, ...additionalContext });
  }
}

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId: string, context?: LogContext): Logger {
  return new Logger({ requestId, ...context });
}
