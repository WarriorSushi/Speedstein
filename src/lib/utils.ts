export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatCls(value: number | null): string {
  if (value === null) return '—';
  return value.toFixed(3);
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green';
  if (score >= 50) return 'text-yellow';
  return 'text-red';
}

export function getScoreColorHex(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green';
    case 'B': return 'text-teal';
    case 'C': return 'text-yellow';
    case 'D': return 'text-orange';
    case 'F': return 'text-red';
    default: return 'text-muted';
  }
}

export function getGradeBgColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-green/10 border-green/20';
    case 'B': return 'bg-teal/10 border-teal/20';
    case 'C': return 'bg-yellow/10 border-yellow/20';
    case 'D': return 'bg-orange/10 border-orange/20';
    case 'F': return 'bg-red/10 border-red/20';
    default: return 'bg-surface border-border';
  }
}

export function getResourceTypeColor(type: string): string {
  switch (type) {
    case 'script': return '#eab308';
    case 'stylesheet': return '#8b5cf6';
    case 'image': return '#14b8a6';
    case 'font': return '#f97316';
    case 'document': return '#3b82f6';
    default: return '#737373';
  }
}

export function getVitalRating(metric: string, value: number | null): 'good' | 'needs-improvement' | 'poor' {
  if (value === null) return 'needs-improvement';
  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fid: [100, 300],
    cls: [0.1, 0.25],
    ttfb: [800, 1800],
    fcp: [1800, 3000],
    inp: [200, 500],
    si: [3400, 5800],
    tbt: [200, 600],
  };
  const [good, poor] = thresholds[metric] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good': return 'text-green';
    case 'needs-improvement': return 'text-yellow';
    case 'poor': return 'text-red';
  }
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
