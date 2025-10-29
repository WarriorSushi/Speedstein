/**
 * Dashboard Overview Page
 * Phase 3: User Story 1 (T040, T042, T043)
 * Shows subscription tier, usage stats, and quota limits with progress bar
 */

'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, FileText, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { tier, quota, usage, loading } = useSubscription();

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

  // Determine tier color
  const getTierColor = (t: string) => {
    switch (t) {
      case 'free':
        return 'secondary';
      case 'starter':
        return 'default';
      case 'pro':
        return 'default';
      case 'enterprise':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your Speedstein account and usage
        </p>
      </div>

      {/* Subscription Tier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription tier and limits</CardDescription>
            </div>
            <Badge variant={getTierColor(tier)} className="text-lg px-4 py-1">
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {pdfsGenerated} / {quotaLimit} PDFs used this month
                </span>
                <span className="text-sm text-muted-foreground">
                  {quotaRemaining} remaining
                </span>
              </div>
              <Progress value={quotaPercentage} className="h-2" />
            </div>

            {quotaPercentage >= 80 && (
              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <span>
                  You&apos;ve used {Math.round(quotaPercentage)}% of your monthly quota
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/billing">
                  {tier === 'free' ? 'Upgrade Plan' : 'Manage Billing'}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/api-keys">View API Keys</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="PDFs Generated"
          value={pdfsGenerated}
          description="This month"
          icon={FileText}
        />
        <StatsCard
          title="Monthly Quota"
          value={quotaLimit.toLocaleString()}
          description={`${tier.charAt(0).toUpperCase() + tier.slice(1)} tier limit`}
          icon={Zap}
        />
        <StatsCard
          title="Quota Remaining"
          value={quotaRemaining.toLocaleString()}
          description={`${Math.round(100 - quotaPercentage)}% available`}
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get started with the Speedstein API</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Generate an API Key</h4>
            <p className="text-sm text-muted-foreground">
              Create an API key to authenticate your PDF generation requests
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/api-keys">Generate Key</Link>
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">2. Read the Documentation</h4>
            <p className="text-sm text-muted-foreground">
              Learn how to integrate Speedstein into your application
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/docs">View Docs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
