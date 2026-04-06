'use client';

import type { CoreWebVitals } from '@/types';
import { formatMs, formatCls, getVitalRating, getRatingColor } from '@/lib/utils';
import { Clock, Layers, MousePointer, BarChart3, Gauge, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface VitalsGridProps {
  vitals: CoreWebVitals;
}

interface VitalCardProps {
  label: string;
  abbr: string;
  value: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  icon: LucideIcon;
}

function VitalCard({ label, abbr, value, rating, icon: Icon }: VitalCardProps) {
  const ratingBg = {
    good: 'bg-green/5 border-green/15',
    'needs-improvement': 'bg-yellow/5 border-yellow/15',
    poor: 'bg-red/5 border-red/15',
  }[rating];

  return (
    <div className={`rounded-xl border p-4 ${ratingBg} transition-colors`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted" />
        <span className="text-xs text-muted uppercase tracking-wider font-medium">{abbr}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${getRatingColor(rating)}`}>
        {value}
      </div>
      <div className="text-xs text-muted mt-1">{label}</div>
      <div className="mt-3 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          rating === 'good' ? 'bg-green' : rating === 'needs-improvement' ? 'bg-yellow' : 'bg-red'
        }`} />
        <span className="text-xs text-muted capitalize">
          {rating === 'needs-improvement' ? 'Needs Work' : rating}
        </span>
      </div>
    </div>
  );
}

export default function VitalsGrid({ vitals }: VitalsGridProps) {
  const items: { key: keyof CoreWebVitals; label: string; abbr: string; icon: LucideIcon; format: (v: number | null) => string }[] = [
    { key: 'lcp', label: 'Largest Contentful Paint', abbr: 'LCP', icon: Layers, format: formatMs },
    { key: 'fcp', label: 'First Contentful Paint', abbr: 'FCP', icon: Clock, format: formatMs },
    { key: 'cls', label: 'Cumulative Layout Shift', abbr: 'CLS', icon: BarChart3, format: formatCls },
    { key: 'tbt', label: 'Total Blocking Time', abbr: 'TBT', icon: Timer, format: formatMs },
    { key: 'si', label: 'Speed Index', abbr: 'SI', icon: Gauge, format: formatMs },
    { key: 'ttfb', label: 'Time to First Byte', abbr: 'TTFB', icon: MousePointer, format: formatMs },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Core Web Vitals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map(({ key, label, abbr, icon, format }) => (
          <VitalCard
            key={key}
            label={label}
            abbr={abbr}
            value={format(vitals[key])}
            rating={getVitalRating(key, vitals[key])}
            icon={icon}
          />
        ))}
      </div>
    </div>
  );
}
