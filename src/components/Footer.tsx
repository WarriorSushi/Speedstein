'use client';

import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-teal" />
          <span>Speedstein — powered by Google Lighthouse</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Mobile analysis</span>
          <span>·</span>
          <span>Free &amp; open</span>
        </div>
      </div>
    </footer>
  );
}
