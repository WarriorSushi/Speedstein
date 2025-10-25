/**
 * API Error classes
 *
 * Defines standardized error types for the Speedstein API
 * Used across both frontend and backend for consistent error handling
 *
 * @packageDocumentation
 */

/**
 * Standard error codes used throughout the API
 */
export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  REVOKED_API_KEY = 'REVOKED_API_KEY',

  // Validation errors (400)
  INVALID_HTML = 'INVALID_HTML',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',

  // Rate limiting errors (429)
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Payload errors (413)
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',

  // Timeout errors (504)
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  BROWSER_ERROR = 'BROWSER_ERROR',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
}

/**
 * Error details that can be included in the error response
 */
export interface ErrorDetails {
  [key: string]: unknown;
  field?: string;
  issue?: string;
  hint?: string;
  provided?: unknown;
  expected?: unknown;
  maxSize?: number;
  providedSize?: number;
  quota?: number;
  used?: number;
  remaining?: number;
  resetDate?: string;
  upgradeUrl?: string;
  timeout?: number;
  requestId?: string;
}

/**
 * API Error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: ErrorDetails;
  };
}

/**
 * Base API Error class
 *
 * Extends the built-in Error class with HTTP status codes and structured error details.
 * All API errors should extend this class or use one of its specialized subclasses.
 *
 * @example
 * ```typescript
 * throw new ApiError(
 *   ErrorCode.INVALID_HTML,
 *   'HTML content is required',
 *   400,
 *   { field: 'html', issue: 'missing or empty' }
 * );
 * ```
 */
export class ApiError extends Error {
  /**
   * Error code (e.g., 'INVALID_HTML', 'QUOTA_EXCEEDED')
   */
  public readonly code: ErrorCode | string;

  /**
   * HTTP status code (e.g., 400, 401, 429, 500)
   */
  public readonly status: number;

  /**
   * Additional error details
   */
  public readonly details?: ErrorDetails;

  /**
   * Creates a new ApiError
   *
   * @param code - Error code from ErrorCode enum
   * @param message - Human-readable error message
   * @param status - HTTP status code
   * @param details - Optional additional error details
   */
  constructor(code: ErrorCode | string, message: string, status: number, details?: ErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;

    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convert error to API response format
   */
  toJSON(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }

  /**
   * Convert error to Response object (for Cloudflare Workers)
   */
  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Authentication Error (401)
 * Thrown when API key is invalid or missing
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Invalid or revoked API key', details?: ErrorDetails) {
    super(ErrorCode.UNAUTHORIZED, message, 401, {
      hint: 'Check your API key in the dashboard at https://speedstein.com/dashboard/api-keys',
      ...details,
    });
    this.name = 'UnauthorizedError';
  }
}

/**
 * Validation Error (400)
 * Thrown when request payload fails validation
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: ErrorDetails) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Invalid HTML Error (400)
 * Thrown when HTML content is missing or invalid
 */
export class InvalidHtmlError extends ApiError {
  constructor(message = 'HTML content is required and must be a non-empty string', details?: ErrorDetails) {
    super(ErrorCode.INVALID_HTML, message, 400, {
      field: 'html',
      ...details,
    });
    this.name = 'InvalidHtmlError';
  }
}

/**
 * Payload Too Large Error (413)
 * Thrown when HTML content exceeds maximum size (10MB)
 */
export class PayloadTooLargeError extends ApiError {
  constructor(providedSize: number, maxSize = 10_485_760) {
    super(ErrorCode.PAYLOAD_TOO_LARGE, `HTML content exceeds maximum size of 10MB`, 413, {
      maxSize,
      providedSize,
    });
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Quota Exceeded Error (429)
 * Thrown when user has exceeded their plan quota
 */
export class QuotaExceededError extends ApiError {
  constructor(quota: number, used: number, resetDate: string) {
    super(
      ErrorCode.QUOTA_EXCEEDED,
      `You have exceeded your plan quota of ${quota.toLocaleString()} PDFs per month`,
      429,
      {
        quota,
        used,
        resetDate,
        upgradeUrl: 'https://speedstein.com/pricing',
      }
    );
    this.name = 'QuotaExceededError';
  }
}

/**
 * Rate Limit Exceeded Error (429)
 * Thrown when user hits rate limit (separate from quota)
 */
export class RateLimitExceededError extends ApiError {
  constructor(message = 'Too many requests', retryAfter?: number) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, {
      ...(retryAfter && { retryAfter }),
      hint: 'Please wait before making more requests',
    });
    this.name = 'RateLimitExceededError';
  }
}

/**
 * Generation Timeout Error (504)
 * Thrown when PDF generation exceeds timeout (10 seconds)
 */
export class GenerationTimeoutError extends ApiError {
  constructor(timeout = 10000) {
    super(
      ErrorCode.GENERATION_TIMEOUT,
      `PDF generation exceeded ${timeout / 1000} second timeout`,
      504,
      {
        timeout,
        hint: 'Try simplifying your HTML or reducing external resources',
      }
    );
    this.name = 'GenerationTimeoutError';
  }
}

/**
 * Internal Server Error (500)
 * Thrown for unexpected errors during PDF generation
 */
export class InternalError extends ApiError {
  constructor(message = 'An unexpected error occurred during PDF generation', requestId?: string) {
    super(ErrorCode.INTERNAL_ERROR, message, 500, {
      ...(requestId && { requestId }),
      hint: requestId
        ? `If this persists, contact support@speedstein.com with request ID: ${requestId}`
        : 'If this persists, contact support@speedstein.com',
    });
    this.name = 'InternalError';
  }
}

/**
 * Database Error (500)
 * Thrown when database operations fail
 */
export class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed', details?: ErrorDetails) {
    super(ErrorCode.DATABASE_ERROR, message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Storage Error (500)
 * Thrown when R2 upload or storage operations fail
 */
export class StorageError extends ApiError {
  constructor(message = 'Failed to store PDF file', details?: ErrorDetails) {
    super(ErrorCode.STORAGE_ERROR, message, 500, details);
    this.name = 'StorageError';
  }
}

/**
 * Browser Error (500)
 * Thrown when browser/Puppeteer operations fail
 */
export class BrowserError extends ApiError {
  constructor(message = 'Browser rendering failed', details?: ErrorDetails) {
    super(ErrorCode.BROWSER_ERROR, message, 500, details);
    this.name = 'BrowserError';
  }
}

/**
 * Not Found Error (404)
 * Thrown when requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, details?: ErrorDetails) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Convert any error to ApiError format
 * Useful for error boundaries and global error handlers
 */
export function toApiError(error: unknown, requestId?: string): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, requestId);
  }

  return new InternalError('An unknown error occurred', requestId);
}
