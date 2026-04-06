'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import UrlInput from '@/components/UrlInput';
import ResultsDashboard from '@/components/ResultsDashboard';
import ErrorDisplay from '@/components/ErrorDisplay';
import { runSpeedTest } from '@/lib/api';
import { saveToHistory } from '@/lib/storage';
import type { SpeedTestResult, TestStatus } from '@/types';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [result, setResult] = useState<SpeedTestResult | null>(null);
  const [error, setError] = useState<string>('');
  const [lastUrl, setLastUrl] = useState<string>('');

  const handleTest = useCallback(async (url: string) => {
    setStatus('loading');
    setResult(null);
    setError('');
    setLastUrl(url);

    try {
      const data = await runSpeedTest(url);
      setResult(data);
      setStatus('success');
      saveToHistory(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setStatus('error');
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastUrl) handleTest(lastUrl);
  }, [lastUrl, handleTest]);

  // Auto-test from URL params
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && status === 'idle') {
      handleTest(urlParam);
    }
  }, [searchParams, status, handleTest]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <UrlInput onSubmit={handleTest} isLoading={status === 'loading'} />

      {status === 'error' && <ErrorDisplay message={error} onRetry={handleRetry} />}

      {status === 'success' && result && <ResultsDashboard result={result} />}
    </div>
  );
}
