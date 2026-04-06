'use client';

import type { ResourceItem } from '@/types';
import { formatBytes, getResourceTypeColor } from '@/lib/utils';
import { useMemo } from 'react';
import { HardDrive } from 'lucide-react';

interface ResourceBreakdownProps {
  resources: ResourceItem[];
}

const TYPE_LABELS: Record<string, string> = {
  script: 'JavaScript',
  stylesheet: 'CSS',
  image: 'Images',
  font: 'Fonts',
  document: 'HTML',
  other: 'Other',
};

export default function ResourceBreakdown({ resources }: ResourceBreakdownProps) {
  const breakdown = useMemo(() => {
    const groups: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;

    for (const r of resources) {
      if (!groups[r.type]) groups[r.type] = { count: 0, size: 0 };
      groups[r.type].count += 1;
      groups[r.type].size += r.transferSize;
      totalSize += r.transferSize;
    }

    return Object.entries(groups)
      .map(([type, data]) => ({
        type,
        label: TYPE_LABELS[type] || type,
        count: data.count,
        size: data.size,
        percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0,
        color: getResourceTypeColor(type),
      }))
      .sort((a, b) => b.size - a.size);
  }, [resources]);

  const totalSize = resources.reduce((sum, r) => sum + r.transferSize, 0);

  if (resources.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-muted" />
          <h2 className="text-lg font-semibold">Resource Breakdown</h2>
        </div>
        <div className="text-sm text-muted">
          {resources.length} resources · {formatBytes(totalSize)} total
        </div>
      </div>

      {/* Stacked bar */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <div className="h-6 rounded-full overflow-hidden flex bg-background">
          {breakdown.map((item) => (
            <div
              key={item.type}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${Math.max(item.percentage, 1)}%`,
                backgroundColor: item.color,
                opacity: 0.8,
              }}
              title={`${item.label}: ${formatBytes(item.size)} (${item.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {breakdown.map((item) => (
            <div key={item.type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 transition-colors">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted">
                  {item.count} files · {formatBytes(item.size)}
                </div>
              </div>
              <div className="text-xs text-muted tabular-nums shrink-0">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
