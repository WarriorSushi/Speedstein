/**
 * Sentry Edge Configuration
 * Phase 2: Foundational (T023)
 * Error tracking for Edge Runtime (Middleware)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Sanitize sensitive data before sending
  beforeSend(event, hint) {
    // Remove API keys from error messages
    if (event.message) {
      event.message = event.message.replace(/sk_[a-zA-Z0-9_]+/g, 'sk_***');
    }

    // Sanitize request data
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['Authorization'];
      }
    }

    return event;
  },

  environment: process.env.NODE_ENV,
});
