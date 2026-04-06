'use client';

import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="rounded-2xl border border-red/20 bg-red/5 p-6 sm:p-8 max-w-xl mx-auto animate-fade-up">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Analysis Failed</h3>
          <p className="text-sm text-muted max-w-md">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-surface border border-border hover:bg-surface-2 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
