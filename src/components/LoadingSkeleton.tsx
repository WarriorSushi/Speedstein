'use client';

import { Zap } from 'lucide-react';

export default function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 space-y-8 animate-fade-up">
      {/* Score skeleton */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="w-44 h-44 rounded-full border-4 border-border animate-pulse flex items-center justify-center">
            <Zap className="w-8 h-8 text-border" />
          </div>
          <div className="flex-1 space-y-4 w-full">
            <div className="h-4 w-64 bg-surface-2 rounded animate-pulse" />
            <div className="h-3 w-40 bg-surface-2 rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="h-8 w-24 bg-surface-2 rounded-lg animate-pulse" />
              <div className="h-8 w-24 bg-surface-2 rounded-lg animate-pulse" />
              <div className="h-8 w-24 bg-surface-2 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Vitals skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-40 bg-surface-2 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <div className="h-3 w-12 bg-surface-2 rounded animate-pulse" />
              <div className="h-7 w-20 bg-surface-2 rounded animate-pulse" />
              <div className="h-3 w-32 bg-surface-2 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Waterfall skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-32 bg-surface-2 rounded animate-pulse" />
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-3 w-32 bg-surface-2 rounded animate-pulse" />
              <div
                className="h-3 bg-surface-2 rounded animate-pulse"
                style={{ width: `${20 + Math.random() * 60}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-2">
              <div className="h-4 w-64 bg-surface-2 rounded animate-pulse" />
              <div className="h-3 w-48 bg-surface-2 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
