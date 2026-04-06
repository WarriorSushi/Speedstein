'use client';

import { useEffect, useState } from 'react';
import { getScoreColorHex } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  grade: string;
  size?: number;
  animate?: boolean;
}

export default function ScoreRing({ score, grade, size = 180, animate = true }: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayed / 100) * circumference;
  const color = getScoreColorHex(score);

  useEffect(() => {
    if (!animate) {
      setDisplayed(score);
      return;
    }
    let frame: number;
    let start: number | null = null;
    const duration = 1500;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score, animate]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth={strokeWidth}
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: animate ? 'none' : 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl sm:text-5xl font-bold tabular-nums" style={{ color }}>
          {displayed}
        </span>
        <span className="text-lg font-semibold text-muted mt-1">{grade}</span>
      </div>
    </div>
  );
}
