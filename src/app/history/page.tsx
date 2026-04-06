'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHistory, clearHistory, deleteHistoryEntry } from '@/lib/storage';
import type { HistoryEntry } from '@/types';
import { formatMs, timeAgo, getGradeColor, getGradeBgColor, getScoreColor } from '@/lib/utils';
import { History, Trash2, ExternalLink, TrendingUp, BarChart3, Clock } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEntries(getHistory());
  }, []);

  const handleClear = useCallback(() => {
    if (confirm('Clear all test history?')) {
      clearHistory();
      setEntries([]);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteHistoryEntry(id);
    setEntries(getHistory());
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Group by URL for trends
  const urlGroups = entries.reduce<Record<string, HistoryEntry[]>>((acc, entry) => {
    if (!acc[entry.url]) acc[entry.url] = [];
    acc[entry.url].push(entry);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-teal" />
          <h1 className="text-2xl font-bold">Test History</h1>
          <span className="text-sm text-muted">({entries.length} tests)</span>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red hover:bg-red/5 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center space-y-4">
          <BarChart3 className="w-12 h-12 text-muted mx-auto" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">No tests yet</h2>
            <p className="text-muted">
              Run your first speed test to start tracking performance over time.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal hover:bg-teal-dim text-background font-semibold rounded-lg transition-colors"
          >
            Run a Test
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trend Summary */}
          {Object.keys(urlGroups).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Score Trends
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(urlGroups).slice(0, 6).map(([url, tests]) => {
                  const latest = tests[0];
                  const previous = tests.length > 1 ? tests[1] : null;
                  const diff = previous ? latest.score - previous.score : 0;
                  return (
                    <div key={url} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                      <div className="text-sm font-mono text-teal truncate">{url.replace(/^https?:\/\//, '')}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-bold ${getScoreColor(latest.score)}`}>
                            {latest.score}
                          </span>
                          <span className={`text-sm font-semibold ${getGradeColor(latest.grade)}`}>
                            {latest.grade}
                          </span>
                        </div>
                        {diff !== 0 && (
                          <span className={`text-sm font-medium ${diff > 0 ? 'text-green' : 'text-red'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">{tests.length} tests · Latest {timeAgo(latest.timestamp)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm ${getGradeBgColor(entry.grade)} ${getGradeColor(entry.grade)}`}>
                  {entry.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-teal truncate">{entry.url.replace(/^https?:\/\//, '')}</span>
                    <a href={entry.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3 h-3 text-muted" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(entry.timestamp)}
                    </span>
                    <span>Score: {entry.score}</span>
                    <span>Analyzed in {formatMs(entry.fetchTime)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/?url=${encodeURIComponent(entry.url)}`}
                    className="px-3 py-1.5 text-xs rounded-md bg-surface-2 border border-border hover:border-teal/30 transition-colors"
                  >
                    Retest
                  </Link>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-md hover:bg-red/10 text-muted hover:text-red transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
