'use client';

import { Suspense } from 'react';
import HomeContent from './HomeContent';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="space-y-4">
          <div className="h-12 w-64 bg-surface rounded-lg animate-pulse mx-auto" />
          <div className="h-6 w-96 bg-surface rounded-lg animate-pulse mx-auto" />
          <div className="h-14 w-full max-w-2xl bg-surface rounded-2xl animate-pulse mx-auto mt-8" />
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
