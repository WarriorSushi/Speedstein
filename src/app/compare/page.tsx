'use client';

import { useState, useCallback } from 'react';
import { ArrowLeftRight, Globe, Loader2, Search } from 'lucide-react';
import { runSpeedTest } from '@/lib/api';
import { saveToHistory } from '@/lib/storage';
import ScoreRing from '@/components/ScoreRing';
import VitalsGrid from '@/components/VitalsGrid';
import ErrorDisplay from '@/components/ErrorDisplay';
import type { SpeedTestResult } from '@/types';
import { formatMs, getVitalRating, getRatingColor } from '@/lib/utils';

type Side = 'left' | 'right';

export default function ComparePage() {
  const [urls, setUrls] = useState({ left: '', right: '' });
  const [results, setResults] = useState<{ left: SpeedTestResult | null; right: SpeedTestResult | null }>({ left: null, right: null });
  const [loading, setLoading] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [errors, setErrors] = useState<{ left: string; right: string }>({ left: '', right: '' });

  const handleTest = useCallback(async (side: Side) => {
    const url = urls[side].trim();
    if (!url) return;

    setLoading((p) => ({ ...p, [side]: true }));
    setErrors((p) => ({ ...p, [side]: '' }));
    setResults((p) => ({ ...p, [side]: null }));

    try {
      const data = await runSpeedTest(url);
      setResults((p) => ({ ...p, [side]: data }));
      saveToHistory(data);
    } catch (err) {
      setErrors((p) => ({
        ...p,
        [side]: err instanceof Error ? err.message : 'Analysis failed',
      }));
    } finally {
      setLoading((p) => ({ ...p, [side]: false }));
    }
  }, [urls]);

  const handleCompare = () => {
    if (urls.left.trim()) handleTest('left');
    if (urls.right.trim()) handleTest('right');
  };

  const bothReady = results.left && results.right;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <ArrowLeftRight className="w-6 h-6 text-teal" />
          <h1 className="text-2xl font-bold">Compare Sites</h1>
        </div>
        <p className="text-muted">Test two URLs side-by-side to compare performance</p>
      </div>

      {/* URL Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className="space-y-2">
            <label className="text-xs text-muted uppercase tracking-wider font-medium">
              Site {side === 'left' ? 'A' : 'B'}
            </label>
            <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-teal/40 transition-colors">
              <Globe className="w-4 h-4 text-muted ml-4 shrink-0" />
              <input
                type="text"
                value={urls[side]}
                onChange={(e) => setUrls((p) => ({ ...p, [side]: e.target.value }))}
                placeholder="example.com"
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted/50"
                disabled={loading[side]}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTest(side);
                }}
              />
              <button
                onClick={() => handleTest(side)}
                disabled={!urls[side].trim() || loading[side]}
                className="mr-2 p-2 rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-40"
              >
                {loading[side] ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal" />
                ) : (
                  <Search className="w-4 h-4 text-muted" />
                )}
              </button>
            </div>
            {loading[side] && (
              <div className="text-xs text-muted flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-teal" />
                Analyzing...
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          disabled={!urls.left.trim() || !urls.right.trim() || loading.left || loading.right}
          className="px-6 py-2.5 bg-teal hover:bg-teal-dim text-background font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Compare Both
        </button>
      </div>

      {/* Errors */}
      {errors.left && <ErrorDisplay message={`Site A: ${errors.left}`} />}
      {errors.right && <ErrorDisplay message={`Site B: ${errors.right}`} />}

      {/* Comparison Results */}
      {(results.left || results.right) && (
        <div className="space-y-8">
          {/* Score comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['left', 'right'] as const).map((side) => {
              const r = results[side];
              if (!r) return (
                <div key={side} className="rounded-2xl border border-border bg-surface p-8 flex items-center justify-center text-muted">
                  {loading[side] ? 'Analyzing...' : 'Enter a URL and test'}
                </div>
              );
              return (
                <div key={side} className="rounded-2xl border border-border bg-surface p-6 flex flex-col items-center gap-4 animate-fade-up">
                  <span className="text-xs text-muted uppercase tracking-wider">
                    Site {side === 'left' ? 'A' : 'B'}
                  </span>
                  <ScoreRing score={r.score} grade={r.grade} size={140} />
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-teal text-sm font-mono truncate max-w-full hover:underline">
                    {r.url.replace(/^https?:\/\//, '')}
                  </a>
                  <div className="text-xs text-muted">
                    Analyzed in {formatMs(r.fetchTime)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-side vitals */}
          {bothReady && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Vitals Comparison</h2>
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs text-muted font-medium uppercase">Metric</th>
                      <th className="px-4 py-3 text-right text-xs text-muted font-medium uppercase">Site A</th>
                      <th className="px-4 py-3 text-right text-xs text-muted font-medium uppercase">Site B</th>
                      <th className="px-4 py-3 text-right text-xs text-muted font-medium uppercase">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { key: 'lcp', label: 'LCP', unit: 'ms' },
                      { key: 'fcp', label: 'FCP', unit: 'ms' },
                      { key: 'cls', label: 'CLS', unit: '' },
                      { key: 'tbt', label: 'TBT', unit: 'ms' },
                      { key: 'si', label: 'SI', unit: 'ms' },
                      { key: 'ttfb', label: 'TTFB', unit: 'ms' },
                    ] as const).map(({ key, label, unit }) => {
                      const a = results.left!.vitals[key];
                      const b = results.right!.vitals[key];
                      const aRating = getVitalRating(key, a);
                      const bRating = getVitalRating(key, b);
                      const winner = a !== null && b !== null ? (a <= b ? 'A' : 'B') : '—';

                      return (
                        <tr key={key} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{label}</td>
                          <td className={`px-4 py-3 text-right tabular-nums font-medium ${getRatingColor(aRating)}`}>
                            {a !== null ? `${key === 'cls' ? a.toFixed(3) : a}${unit ? ` ${unit}` : ''}` : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right tabular-nums font-medium ${getRatingColor(bRating)}`}>
                            {b !== null ? `${key === 'cls' ? b.toFixed(3) : b}${unit ? ` ${unit}` : ''}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              winner === 'A' ? 'bg-teal/10 text-teal' : winner === 'B' ? 'bg-teal/10 text-teal' : 'text-muted'
                            }`}>
                              {winner}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Individual vitals grids */}
          {results.left && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted">Site A — Detailed Vitals</h3>
              <VitalsGrid vitals={results.left.vitals} />
            </div>
          )}
          {results.right && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted">Site B — Detailed Vitals</h3>
              <VitalsGrid vitals={results.right.vitals} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
