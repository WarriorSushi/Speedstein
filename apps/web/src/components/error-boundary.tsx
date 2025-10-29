'use client';

/**
 * Error Boundary Component
 * Phase 6: Sentry Configuration (T071)
 * Catches React component errors and reports to Sentry
 */

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /**
   * Fallback UI to show when error occurs
   * If not provided, shows default error UI
   */
  fallback?: React.ReactNode;
  /**
   * Error boundary context (for Sentry tagging)
   */
  context?: {
    component?: string;
    page?: string;
    [key: string]: unknown;
  };
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary
 *
 * Wraps components to catch errors and report to Sentry.
 * Shows fallback UI when errors occur.
 *
 * @example
 * ```tsx
 * <ErrorBoundary context={{ page: 'Dashboard' }}>
 *   <DashboardContent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry with context
    Sentry.withScope((scope) => {
      // Add context from props
      if (this.props.context) {
        Object.entries(this.props.context).forEach(([key, value]) => {
          scope.setTag(key, String(value));
        });
      }

      // Add error info
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });

      // Capture exception
      Sentry.captureException(error);
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show default error UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An error occurred while rendering this component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-muted p-3 text-sm font-mono">
                  <p className="font-semibold">Error:</p>
                  <p className="text-xs break-all">{this.state.error.message}</p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Stack trace</summary>
                      <pre className="mt-1 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to manually report errors to Sentry
 *
 * @example
 * ```tsx
 * const reportError = useErrorReporting();
 *
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   reportError(error, { operation: 'riskyOperation' });
 * }
 * ```
 */
export function useErrorReporting() {
  return React.useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setTag(key, String(value));
          });
          scope.setContext('errorContext', context);
        }
        Sentry.captureException(error);
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reported:', error, context);
      }
    },
    []
  );
}
