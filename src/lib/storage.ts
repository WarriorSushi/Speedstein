import type { HistoryEntry, SpeedTestResult } from '@/types';

const STORAGE_KEY = 'speedstein_history';
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveToHistory(result: SpeedTestResult): void {
  if (typeof window === 'undefined') return;
  const entry: HistoryEntry = {
    id: result.id,
    url: result.url,
    timestamp: result.timestamp,
    score: result.score,
    grade: result.grade,
    vitals: result.vitals,
    fetchTime: result.fetchTime,
  };

  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function deleteHistoryEntry(id: string): void {
  if (typeof window === 'undefined') return;
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getHistoryForUrl(url: string): HistoryEntry[] {
  return getHistory().filter((e) => e.url === url);
}
