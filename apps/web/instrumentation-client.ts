/**
 * Client-side Instrumentation
 * This file initializes Sentry on the client side
 */

import * as Sentry from '@sentry/nextjs';
import './sentry.client.config';

// Export the router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
