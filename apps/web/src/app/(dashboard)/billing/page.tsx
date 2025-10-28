/**
 * Dashboard Billing Page
 * Subscription management, payment history, and plan upgrades
 */

'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Receipt, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    quota: '100 PDFs/month',
    features: [
      '100 PDF generations per month',
      'Up to 25 pages per PDF',
      'Standard generation speed',
      'Email support',
      'API access',
    ],
  },
  {
    name: 'Starter',
    price: '$29',
    period: 'month',
    quota: '1,000 PDFs/month',
    features: [
      '1,000 PDF generations per month',
      'Up to 100 pages per PDF',
      'Fast generation speed',
      'Priority email support',
      'API access',
      'Webhook notifications',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: 'month',
    quota: '10,000 PDFs/month',
    features: [
      '10,000 PDF generations per month',
      'Unlimited pages per PDF',
      'Fastest generation speed',
      '24/7 priority support',
      'API access',
      'Webhook notifications',
      'Custom watermarks',
      'SLA guarantee',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    quota: 'Unlimited',
    features: [
      'Unlimited PDF generations',
      'Unlimited pages per PDF',
      'Dedicated infrastructure',
      'Dedicated account manager',
      'Custom integrations',
      'On-premise deployment option',
      'Custom SLA',
      'White-label solution',
    ],
  },
];

export default function BillingPage() {
  const { tier, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing & Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the {tier} plan</CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-4 py-1 capitalize">
              {tier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {tier === 'free'
                  ? 'Upgrade to unlock more features and higher quotas'
                  : 'Next billing date: Not configured yet'}
              </p>
            </div>
            <div className="flex gap-2">
              {tier === 'free' && (
                <Button>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Integration Coming Soon */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-yellow-900 dark:text-yellow-100">
              Payment Integration Coming Soon
            </CardTitle>
          </div>
          <CardDescription className="text-yellow-800 dark:text-yellow-200">
            We&apos;re currently setting up DodoPayments integration for seamless subscription management.
            This feature will be available soon in Phase 6.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-4">Available Plans</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg' : ''
              } ${tier.toLowerCase() === plan.name.toLowerCase() ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              {tier.toLowerCase() === plan.name.toLowerCase() && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge variant="outline" className="bg-background">Current Plan</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                </div>
                <CardDescription>{plan.quota}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier.toLowerCase() === plan.name.toLowerCase() ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : plan.name === 'Enterprise' ? (
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="mailto:sales@speedstein.com">Contact Sales</Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled
                  >
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <CardTitle>Payment History</CardTitle>
          </div>
          <CardDescription>Your billing and invoice history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payment history yet. Upgrade to a paid plan to see your invoices here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
