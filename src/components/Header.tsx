'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
            <Zap className="w-4 h-4 text-teal" />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            Speed<span className="text-teal">stein</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground rounded-md hover:bg-surface-2 transition-colors"
          >
            Test
          </Link>
          <Link
            href="/history"
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground rounded-md hover:bg-surface-2 transition-colors"
          >
            History
          </Link>
          <Link
            href="/compare"
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground rounded-md hover:bg-surface-2 transition-colors"
          >
            Compare
          </Link>
        </nav>
      </div>
    </header>
  );
}
