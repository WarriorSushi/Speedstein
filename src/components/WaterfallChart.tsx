'use client';

import { useState, useMemo } from 'react';
import type { ResourceItem } from '@/types';
import { formatBytes, formatMs, getResourceTypeColor } from '@/lib/utils';
import { Filter } from 'lucide-react';

interface WaterfallChartProps {
  resources: ResourceItem[];
}

const RESOURCE_TYPES = ['all', 'script', 'stylesheet', 'image', 'font', 'document', 'other'] as const;

const TYPE_LABELS: Record<string, string> = {
  all: 'All',
  script: 'JS',
  stylesheet: 'CSS',
  image: 'Images',
  font: 'Fonts',
  document: 'HTML',
  other: 'Other',
};

export default function WaterfallChart({ resources }: WaterfallChartProps) {
  const [filter, setFilter] = useState<string>('all');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxTime = useMemo(() => {
    return Math.max(...resources.map((r) => r.startTime + r.duration), 1);
  }, [resources]);

  const filtered = useMemo(() => {
    if (filter === 'all') return resources;
    return resources.filter((r) => r.type === filter);
  }, [resources, filter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: resources.length };
    for (const r of resources) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }
    return counts;
  }, [resources]);

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
        No resource data available
      </div>
    );
  }

  const getFilename = (url: string) => {
    try {
      const u = new URL(url);
      const path = u.pathname.split('/').pop() || u.hostname;
      return path.length > 30 ? path.slice(0, 27) + '...' : path;
    } catch {
      return url.slice(0, 30);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Waterfall</h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-muted" />
          {RESOURCE_TYPES.map((type) => {
            const count = typeCounts[type] || 0;
            if (type !== 'all' && count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  filter === type
                    ? 'bg-teal/10 text-teal border border-teal/20'
                    : 'text-muted hover:text-foreground hover:bg-surface-2 border border-transparent'
                }`}
              >
                {TYPE_LABELS[type]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Time scale */}
        <div className="flex items-center px-4 py-2 border-b border-border text-xs text-muted">
          <div className="w-40 sm:w-56 shrink-0">Resource</div>
          <div className="flex-1 flex justify-between">
            <span>0 ms</span>
            <span>{formatMs(maxTime / 4)}</span>
            <span>{formatMs(maxTime / 2)}</span>
            <span>{formatMs((maxTime * 3) / 4)}</span>
            <span>{formatMs(maxTime)}</span>
          </div>
        </div>

        {/* Resource rows */}
        <div className="max-h-96 overflow-y-auto">
          {filtered.map((resource, i) => {
            const left = (resource.startTime / maxTime) * 100;
            const width = Math.max((resource.duration / maxTime) * 100, 0.5);
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={`${resource.url}-${i}`}
                className={`flex items-center px-4 py-1.5 border-b border-border/50 text-xs transition-colors ${
                  isHovered ? 'bg-surface-2' : 'hover:bg-surface-2/50'
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="w-40 sm:w-56 shrink-0 flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getResourceTypeColor(resource.type) }}
                  />
                  <span className="truncate text-muted" title={resource.url}>
                    {getFilename(resource.url)}
                  </span>
                </div>
                <div className="flex-1 relative h-5">
                  <div
                    className="absolute top-1 h-3 rounded-sm animate-waterfall"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: getResourceTypeColor(resource.type),
                      opacity: 0.8,
                      animationDelay: `${i * 30}ms`,
                    }}
                  />
                </div>
                {isHovered && (
                  <div className="shrink-0 text-right text-muted ml-2 hidden sm:block">
                    {formatBytes(resource.transferSize)} · {formatMs(resource.duration)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-6 text-xs text-muted flex-wrap">
          <span>{filtered.length} resources</span>
          <span>
            {formatBytes(filtered.reduce((sum, r) => sum + r.transferSize, 0))} total
          </span>
          <div className="flex items-center gap-3 ml-auto">
            {['script', 'stylesheet', 'image', 'font'].map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getResourceTypeColor(type) }}
                />
                <span>{TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
