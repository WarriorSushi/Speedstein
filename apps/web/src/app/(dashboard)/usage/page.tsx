/**
 * Dashboard Usage Page
 * Detailed usage analytics, PDF history, and quota tracking
 */

'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, TrendingUp, Activity, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PDFRecord {
  id: string;
  created_at: string;
  status: 'success' | 'error';
  pages: number | null;
  size_bytes: number | null;
}

export default function UsagePage() {
  const { tier, quota, usage, loading } = useSubscription();
  const [pdfHistory, setPdfHistory] = useState<PDFRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPDFHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get last 30 days of PDF generation history
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
          .from('pdf_generations')
          .select('id, created_at, status, pages, size_bytes')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          setPdfHistory(data as PDFRecord[]);
        }
      } catch (err) {
        console.error('Error fetching PDF history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchPDFHistory();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const pdfsGenerated = usage?.pdfsGenerated ?? 0;
  const quotaLimit = usage?.quotaLimit ?? quota;
  const quotaRemaining = usage?.quotaRemaining ?? quotaLimit;
  const quotaPercentage = usage?.quotaPercentageUsed ?? 0;

  // Calculate success rate
  const successfulPDFs = pdfHistory.filter(pdf => pdf.status === 'success').length;
  const successRate = pdfHistory.length > 0
    ? Math.round((successfulPDFs / pdfHistory.length) * 100)
    : 100;

  // Calculate total size
  const totalSize = pdfHistory.reduce((acc, pdf) => acc + (pdf.size_bytes || 0), 0);
  const avgSize = pdfHistory.length > 0 ? totalSize / pdfHistory.length : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Usage Analytics</h2>
        <p className="text-muted-foreground">
          Detailed insights into your PDF generation activity
        </p>
      </div>

      {/* Current Period Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDFs This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pdfsGenerated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {quotaRemaining.toLocaleString()} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {successfulPDFs} of {pdfHistory.length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg File Size</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(avgSize)}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatBytes(totalSize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{tier}</div>
            <p className="text-xs text-muted-foreground">
              {quotaLimit.toLocaleString()} PDF/month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quota Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Quota</CardTitle>
          <CardDescription>
            Your usage for the current billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {pdfsGenerated.toLocaleString()} / {quotaLimit.toLocaleString()} PDFs used
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(quotaPercentage)}%
              </span>
            </div>
            <Progress value={quotaPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Remaining this month</span>
            <span className="font-medium">{quotaRemaining.toLocaleString()} PDFs</span>
          </div>

          {quotaPercentage >= 80 && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
              You&apos;re approaching your quota limit. Consider upgrading your plan to avoid service interruption.
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Generation History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your PDF generation history for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : pdfHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No PDF generations yet. Start by generating your first PDF!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pdfHistory.map((pdf) => (
                    <TableRow key={pdf.id}>
                      <TableCell>
                        {format(new Date(pdf.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {pdf.status === 'success' ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{pdf.pages ?? 'N/A'}</TableCell>
                      <TableCell>{pdf.size_bytes ? formatBytes(pdf.size_bytes) : 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {pdf.id.slice(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Tips</CardTitle>
          <CardDescription>Get the most out of your Speedstein usage</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use batch generation to process multiple PDFs efficiently and save API calls</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Optimize your HTML content size to reduce generation time and costs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Cache generated PDFs on your end to avoid regenerating the same content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Implement retry logic with exponential backoff for failed requests</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Monitor your usage dashboard regularly to stay within quota limits</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
