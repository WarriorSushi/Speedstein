'use client';

import { useState } from 'react';
import type { AuditItem } from '@/types';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface RecommendationsProps {
  audits: AuditItem[];
}

const IMPACT_CONFIG = {
  high: { icon: AlertTriangle, color: 'text-red', bg: 'bg-red/5 border-red/15', label: 'High Impact' },
  medium: { icon: AlertCircle, color: 'text-yellow', bg: 'bg-yellow/5 border-yellow/15', label: 'Medium Impact' },
  low: { icon: Info, color: 'text-muted', bg: 'bg-surface-2 border-border', label: 'Low Impact' },
};

export default function Recommendations({ audits }: RecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (audits.length === 0) {
    return (
      <div className="rounded-xl border border-green/20 bg-green/5 p-6 text-center">
        <div className="text-green font-semibold">All checks passed!</div>
        <div className="text-sm text-muted mt-1">No optimization recommendations at this time.</div>
      </div>
    );
  }

  const grouped = {
    high: audits.filter((a) => a.impact === 'high'),
    medium: audits.filter((a) => a.impact === 'medium'),
    low: audits.filter((a) => a.impact === 'low'),
  };

  const displayed = showAll ? audits : audits.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recommendations</h2>
        <div className="flex items-center gap-3 text-xs">
          {(['high', 'medium', 'low'] as const).map((impact) => {
            const count = grouped[impact].length;
            if (count === 0) return null;
            const config = IMPACT_CONFIG[impact];
            return (
              <span key={impact} className={`flex items-center gap-1.5 ${config.color}`}>
                <config.icon className="w-3 h-3" />
                {count} {config.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {displayed.map((audit) => {
          const config = IMPACT_CONFIG[audit.impact];
          const isExpanded = expandedId === audit.id;

          return (
            <div
              key={audit.id}
              className={`rounded-xl border ${config.bg} overflow-hidden transition-colors`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : audit.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                <config.icon className={`w-4 h-4 ${config.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{audit.title}</div>
                  {audit.displayValue && (
                    <div className="text-xs text-muted mt-0.5">{audit.displayValue}</div>
                  )}
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                  {audit.impact}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="text-sm text-muted leading-relaxed border-t border-border/50 pt-3">
                    {cleanDescription(audit.description)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {audits.length > 10 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-sm text-teal hover:text-teal-dim transition-colors"
        >
          Show {audits.length - 10} more recommendations
        </button>
      )}
    </div>
  );
}

function cleanDescription(desc: string): string {
  // Remove markdown links
  return desc.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`([^`]+)`/g, '$1');
}
