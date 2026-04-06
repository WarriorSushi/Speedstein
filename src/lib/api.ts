import type { SpeedTestResult, CoreWebVitals, ResourceItem, AuditItem, ScreenshotItem } from '@/types';

const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  // Validate
  new URL(url);
  return url;
}

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function extractVitals(lighthouseResult: Record<string, unknown>): CoreWebVitals {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const getNumeric = (id: string): number | null => {
    const audit = audits?.[id];
    if (!audit || audit.numericValue === undefined) return null;
    return Math.round(audit.numericValue as number);
  };

  return {
    lcp: getNumeric('largest-contentful-paint'),
    fid: getNumeric('max-potential-fid'),
    cls: audits?.['cumulative-layout-shift']?.numericValue != null
      ? Math.round((audits['cumulative-layout-shift'].numericValue as number) * 1000) / 1000
      : null,
    ttfb: getNumeric('server-response-time'),
    fcp: getNumeric('first-contentful-paint'),
    inp: getNumeric('interaction-to-next-paint'),
    si: getNumeric('speed-index'),
    tbt: getNumeric('total-blocking-time'),
  };
}

function extractResources(lighthouseResult: Record<string, unknown>): ResourceItem[] {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const networkAudit = audits?.['network-requests'];
  if (!networkAudit?.details) return [];

  const details = networkAudit.details as Record<string, unknown>;
  const items = (details.items as Array<Record<string, unknown>>) || [];

  const typeMap: Record<string, ResourceItem['type']> = {
    Script: 'script',
    Stylesheet: 'stylesheet',
    Image: 'image',
    Font: 'font',
    Document: 'document',
  };

  return items
    .filter((item) => (item.transferSize as number) > 0)
    .slice(0, 50)
    .map((item) => ({
      url: (item.url as string) || '',
      type: typeMap[item.resourceType as string] || 'other',
      transferSize: Math.round(item.transferSize as number),
      startTime: Math.round(item.startTime as number),
      duration: Math.round((item.endTime as number) - (item.startTime as number)),
    }));
}

function extractAudits(lighthouseResult: Record<string, unknown>): AuditItem[] {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const categories = lighthouseResult.categories as Record<string, Record<string, unknown>>;
  const perfCategory = categories?.performance;
  if (!perfCategory) return [];

  const auditRefs = (perfCategory.auditRefs as Array<Record<string, unknown>>) || [];
  const result: AuditItem[] = [];

  for (const ref of auditRefs) {
    const id = ref.id as string;
    const audit = audits?.[id];
    if (!audit || audit.score === null || audit.score === undefined) continue;
    const score = audit.score as number;
    // Only include failed/warning audits
    if (score >= 0.9) continue;

    let impact: AuditItem['impact'] = 'low';
    const weight = (ref.weight as number) || 0;
    if (weight >= 10 || score < 0.3) impact = 'high';
    else if (weight >= 5 || score < 0.5) impact = 'medium';

    result.push({
      id,
      title: audit.title as string,
      description: (audit.description as string) || '',
      score,
      displayValue: audit.displayValue as string | undefined,
      impact,
      savings: audit.displayValue as string | undefined,
    });
  }

  return result.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impact] - order[b.impact];
  });
}

function extractScreenshots(lighthouseResult: Record<string, unknown>): ScreenshotItem[] {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const timeline = audits?.['screenshot-thumbnails'];
  if (!timeline?.details) return [];

  const details = timeline.details as Record<string, unknown>;
  const items = (details.items as Array<Record<string, unknown>>) || [];

  return items.map((item) => ({
    timing: item.timing as number,
    timestamp: item.timestamp as number,
    data: (item.data as string) || '',
  }));
}

function extractFinalScreenshot(lighthouseResult: Record<string, unknown>): string | undefined {
  const audits = lighthouseResult.audits as Record<string, Record<string, unknown>>;
  const ss = audits?.['final-screenshot'];
  if (!ss?.details) return undefined;
  const details = ss.details as Record<string, unknown>;
  return details.data as string | undefined;
}

export async function runSpeedTest(inputUrl: string): Promise<SpeedTestResult> {
  const url = normalizeUrl(inputUrl);
  const startTime = Date.now();

  const apiUrl = `${PSI_API}?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = (errorData as Record<string, Record<string, string>>)?.error?.message || `API returned ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const lighthouseResult = data.lighthouseResult;

  if (!lighthouseResult) {
    throw new Error('No Lighthouse results returned. The URL may be unreachable.');
  }

  const perfScore = Math.round(
    ((lighthouseResult.categories?.performance?.score as number) || 0) * 100
  );

  const id = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    url,
    timestamp: Date.now(),
    score: perfScore,
    grade: scoreToGrade(perfScore),
    vitals: extractVitals(lighthouseResult),
    resources: extractResources(lighthouseResult),
    audits: extractAudits(lighthouseResult),
    screenshots: extractScreenshots(lighthouseResult),
    fetchTime: Date.now() - startTime,
    finalScreenshot: extractFinalScreenshot(lighthouseResult),
  };
}

export { normalizeUrl, scoreToGrade };
