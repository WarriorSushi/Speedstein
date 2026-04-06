'use client';

import type { ScreenshotItem } from '@/types';
import { Camera } from 'lucide-react';
import { formatMs } from '@/lib/utils';
import Image from 'next/image';

interface ScreenshotTimelineProps {
  screenshots: ScreenshotItem[];
  finalScreenshot?: string;
}

export default function ScreenshotTimeline({ screenshots, finalScreenshot }: ScreenshotTimelineProps) {
  if (screenshots.length === 0 && !finalScreenshot) {
    return null;
  }

  // Sample screenshots evenly (max 8)
  const sampled = screenshots.length <= 8
    ? screenshots
    : screenshots.filter((_, i) =>
        i === 0 ||
        i === screenshots.length - 1 ||
        i % Math.ceil(screenshots.length / 6) === 0
      ).slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-5 h-5 text-muted" />
        <h2 className="text-lg font-semibold">Loading Timeline</h2>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {sampled.map((ss, i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-32 h-24 rounded-lg border border-border overflow-hidden bg-background relative">
                {ss.data ? (
                  <Image
                    src={ss.data}
                    alt={`Page at ${formatMs(ss.timing)}`}
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                    No preview
                  </div>
                )}
              </div>
              <span className="text-xs text-muted tabular-nums">{formatMs(ss.timing)}</span>
            </div>
          ))}
        </div>
      </div>

      {finalScreenshot && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Final Screenshot</h3>
          <div className="rounded-xl border border-border overflow-hidden bg-surface inline-block max-w-md">
            <Image
              src={finalScreenshot}
              alt="Final page render"
              width={400}
              height={300}
              className="w-full h-auto"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
