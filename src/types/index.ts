export interface CoreWebVitals {
  lcp: number | null; // Largest Contentful Paint (ms)
  fid: number | null; // First Input Delay (ms)
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte (ms)
  fcp: number | null; // First Contentful Paint (ms)
  inp: number | null; // Interaction to Next Paint (ms)
  si: number | null; // Speed Index (ms)
  tbt: number | null; // Total Blocking Time (ms)
}

export interface ResourceItem {
  url: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'document' | 'other';
  transferSize: number; // bytes
  startTime: number; // ms
  duration: number; // ms
}

export interface AuditItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  impact: 'high' | 'medium' | 'low';
  savings?: string;
}

export interface ScreenshotItem {
  timing: number;
  timestamp: number;
  data: string; // base64
}

export interface SpeedTestResult {
  id: string;
  url: string;
  timestamp: number;
  score: number; // 0-100
  grade: string; // A-F
  vitals: CoreWebVitals;
  resources: ResourceItem[];
  audits: AuditItem[];
  screenshots: ScreenshotItem[];
  fetchTime: number; // how long the test took (ms)
  finalScreenshot?: string; // base64
}

export interface HistoryEntry {
  id: string;
  url: string;
  timestamp: number;
  score: number;
  grade: string;
  vitals: CoreWebVitals;
  fetchTime: number;
}

export type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ComparisonState {
  left: SpeedTestResult | null;
  right: SpeedTestResult | null;
}
