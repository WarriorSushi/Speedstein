'use client';

import type { SpeedTestResult } from '@/types';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';

interface ExportBarProps {
  result: SpeedTestResult;
}

export default function ExportBar({ result }: ExportBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    const shareUrl = `${window.location.origin}/?url=${encodeURIComponent(result.url)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result.url]);

  const handleExportPdf = useCallback(() => {
    // Use browser print as PDF export
    window.print();
  }, []);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speedstein-${new URL(result.url).hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="flex items-center gap-2 no-print flex-wrap">
      <button
        onClick={handleExportPdf}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-surface border border-border hover:bg-surface-2 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </button>
      <button
        onClick={handleExportJson}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-surface border border-border hover:bg-surface-2 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export JSON
      </button>
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-surface border border-border hover:bg-surface-2 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Share Link
          </>
        )}
      </button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(
            `Performance Report: ${result.url}\nScore: ${result.score}/100 (${result.grade})\nLCP: ${result.vitals.lcp}ms | FCP: ${result.vitals.fcp}ms | CLS: ${result.vitals.cls} | TBT: ${result.vitals.tbt}ms`
          );
        }}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-surface border border-border hover:bg-surface-2 transition-colors"
      >
        <Copy className="w-4 h-4" />
        Copy Summary
      </button>
    </div>
  );
}
