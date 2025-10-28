/**
 * Monitoring Service for Cloudflare Workers
 * Phase 2: Foundational (T024)
 * Provides error tracking and performance monitoring using Sentry browser SDK
 */

import * as Sentry from '@sentry/browser';

/**
 * Initialize Sentry for Cloudflare Workers
 * IMPORTANT: Use @sentry/browser (not @sentry/node) because Cloudflare Workers use V8 isolates
 */
export function initSentry(dsn: string, environment: string = 'production') {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: 1.0,
    debug: false,

    // Disable automatic breadcrumbs as they may not work in Workers
    integrations: [],
  });
}

/**
 * Capture an error with context
 */
export function captureError(
  error: Error,
  context?: {
    userId?: string;
    apiKeyId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    [key: string]: unknown;
  }
) {
  Sentry.withScope((scope) => {
    if (context) {
      // Set user context
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }

      // Set tags for filtering
      if (context.apiKeyId) {
        scope.setTag('api_key_id', context.apiKeyId);
      }
      if (context.endpoint) {
        scope.setTag('endpoint', context.endpoint);
      }
      if (context.method) {
        scope.setTag('http_method', context.method);
      }
      if (context.requestId) {
        scope.setTag('request_id', context.requestId);
      }

      // Set extra context
      const extraContext = { ...context };
      delete extraContext.userId;
      delete extraContext.apiKeyId;
      delete extraContext.requestId;
      delete extraContext.endpoint;
      delete extraContext.method;

      if (Object.keys(extraContext).length > 0) {
        scope.setContext('extra', extraContext);
      }
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('extra', context);
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Track performance metrics
 */
export function trackPerformanceMetrics(
  operation: string,
  durationMs: number,
  context?: {
    userId?: string;
    tier?: string;
    success?: boolean;
    [key: string]: unknown;
  }
) {
  // Log performance data
  console.log(
    JSON.stringify({
      type: 'performance',
      operation,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
      ...context,
    })
  );

  // Capture as Sentry transaction
  Sentry.withScope((scope) => {
    if (context) {
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context.tier) {
        scope.setTag('tier', context.tier);
      }
      if (context.success !== undefined) {
        scope.setTag('success', String(context.success));
      }

      const extraContext = { ...context };
      delete extraContext.userId;
      delete extraContext.tier;
      delete extraContext.success;

      if (Object.keys(extraContext).length > 0) {
        scope.setContext('extra', extraContext);
      }
    }

    // Create a simple span for the operation
    scope.setContext('performance', {
      operation,
      duration_ms: durationMs,
    });

    Sentry.captureMessage(`Performance: ${operation}`, 'info');
  });
}

/**
 * Set user context globally
 */
export function setUserContext(userId: string, metadata?: Record<string, unknown>) {
  Sentry.setUser({
    id: userId,
    ...metadata,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}
