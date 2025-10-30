/**
 * Next.js Instrumentation File
 * This file is used to initialize Sentry on the server side
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Export onRequestError hook for error capturing in React Server Components
export const onRequestError = Sentry.captureRequestError;
