'use client';

import { useState, type FormEvent } from 'react';
import { Search, Loader2, Globe } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(url.trim());
  };

  return (
    <div className="text-center space-y-8 py-12 sm:py-20">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Test Your Website
          <br />
          <span className="text-teal">Speed</span>
        </h1>
        <p className="text-muted text-lg sm:text-xl max-w-xl mx-auto">
          Get actionable performance insights powered by Lighthouse.
          Core Web Vitals, waterfall charts, and optimization tips.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-teal/5 blur-xl group-focus-within:bg-teal/10 transition-colors" />
          <div className="relative flex items-center bg-surface border border-border rounded-2xl overflow-hidden focus-within:border-teal/40 transition-colors">
            <Globe className="w-5 h-5 text-muted ml-5 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL — e.g. example.com"
              className="flex-1 bg-transparent px-4 py-4 sm:py-5 text-lg outline-none placeholder:text-muted/50"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="mr-2 px-6 py-2.5 sm:py-3 bg-teal hover:bg-teal-dim text-background font-semibold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Testing...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Test Speed</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {isLoading && (
        <div className="animate-fade-up space-y-3">
          <div className="flex items-center justify-center gap-3 text-muted">
            <Loader2 className="w-5 h-5 animate-spin text-teal" />
            <span>Analyzing performance... this takes 15-30 seconds</span>
          </div>
          <div className="max-w-md mx-auto h-1 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-teal/50 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  );
}
