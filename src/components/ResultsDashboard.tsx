'use client';

import type { SpeedTestResult } from '@/types';
import ScoreRing from './ScoreRing';
import VitalsGrid from './VitalsGrid';
import WaterfallChart from './WaterfallChart';
import Recommendations from './Recommendations';
import ScreenshotTimeline from './ScreenshotTimeline';
import ExportBar from './ExportBar';
import ResourceBreakdown from './ResourceBreakdown';
import { Clock, Globe, Zap } from 'lucide-react';
import { formatMs, timeAgo } from '@/lib/utils';

interface ResultsDashboardProps {
  result: SpeedTestResult;
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header + Score */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <ScoreRing score={result.score} grade={result.grade} />

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Globe className="w-4 h-4 text-muted" />
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline font-mono text-sm truncate max-w-md"
              >
                {result.url}
              </a>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start text-sm text-muted flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeAgo(result.timestamp)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Analyzed in {formatMs(result.fetchTime)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
              <MetricPill label="LCP" value={formatMs(result.vitals.lcp)} />
              <MetricPill label="CLS" value={result.vitals.cls?.toFixed(3) ?? '—'} />
              <MetricPill label="TBT" value={formatMs(result.vitals.tbt)} />
            </div>
          </div>
        </div>
      </div>

      <ExportBar result={result} />

      <VitalsGrid vitals={result.vitals} />

      <ScreenshotTimeline screenshots={result.screenshots} finalScreenshot={result.finalScreenshot} />

      <ResourceBreakdown resources={result.resources} />

      <WaterfallChart resources={result.resources} />

      <Recommendations audits={result.audits} />
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs">
      <span className="text-muted">{label}</span>{' '}
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
