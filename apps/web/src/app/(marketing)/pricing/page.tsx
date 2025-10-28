/**
 * Pricing Page
 *
 * Detailed pricing table with feature comparison across all subscription tiers.
 * Displays quota limits, features, and CTA buttons for each tier.
 *
 * Constitution Compliance:
 * - Principle III: Uses OKLCH design system with shadcn/ui components
 * - Principle VII: Mobile-responsive design with Tailwind breakpoints
 * - Pricing reflects TIER_QUOTAS from packages/shared/src/types/user.ts
 *
 * @packageDocumentation
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    billingCycle: 'forever',
    description: 'Perfect for testing and small projects',
    features: {
      requests: '100 PDFs per month',
      concurrent: '1 concurrent request',
      pageLimit: '10 pages per PDF',
      retention: '7 days storage',
      support: 'Community support',
      sla: 'No SLA',
      apiKeys: '1 API key',
      priority: 'Low priority queue',
    },
    cta: 'Get Started Free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$29',
    billingCycle: 'per month',
    description: 'For growing projects and small businesses',
    features: {
      requests: '1,000 PDFs per month',
      concurrent: '3 concurrent requests',
      pageLimit: '50 pages per PDF',
      retention: '30 days storage',
      support: 'Email support (48h response)',
      sla: '99% uptime SLA',
      apiKeys: '5 API keys',
      priority: 'Standard priority queue',
    },
    cta: 'Start Free Trial',
    href: '/signup?tier=starter',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$99',
    billingCycle: 'per month',
    description: 'For growing businesses with high volume',
    features: {
      requests: '10,000 PDFs per month',
      concurrent: '10 concurrent requests',
      pageLimit: '200 pages per PDF',
      retention: '90 days storage',
      support: 'Priority email support (24h response)',
      sla: '99.9% uptime SLA',
      apiKeys: '25 API keys',
      priority: 'High priority queue',
    },
    cta: 'Start Free Trial',
    href: '/signup?tier=pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    billingCycle: 'contact us',
    description: 'For large scale operations',
    features: {
      requests: '100,000+ PDFs per month',
      concurrent: '50 concurrent requests',
      pageLimit: '1,000 pages per PDF',
      retention: '365 days storage',
      support: 'Dedicated account manager + Slack',
      sla: '99.95% uptime SLA',
      apiKeys: 'Unlimited API keys',
      priority: 'Highest priority queue',
    },
    cta: 'Contact Sales',
    href: '/contact-sales',
    highlight: false,
  },
]

const additionalFeatures = [
  {
    feature: 'SHA-256 hashed API keys',
    free: true,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'Rate limiting protection',
    free: true,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'WCAG AAA compliant PDFs',
    free: true,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'Browser session pooling',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'Custom domain',
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'Webhook notifications',
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'Team collaboration',
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    feature: 'Custom SLA',
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
]

export default function PricingPage() {
  return (
    <div className="w-full py-12 md:py-24">
      <div className="mx-auto max-w-[64rem] space-y-12 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline">Pricing</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Simple, Transparent Pricing
          </h1>
          <p className="max-w-[42rem] text-muted-foreground sm:text-lg">
            Start for free. Upgrade as you grow. No hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-4">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlight ? 'border-primary shadow-lg' : ''}
            >
              <CardHeader>
                {tier.highlight && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.price !== 'Custom' && (
                    <span className="text-muted-foreground">/{tier.billingCycle}</span>
                  )}
                  {tier.price === 'Custom' && (
                    <span className="block text-sm text-muted-foreground">{tier.billingCycle}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {Object.entries(tier.features).map(([key, value]) => (
                    <li key={key} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={tier.href} className="w-full">
                  <Button
                    variant={tier.highlight ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-medium">Feature</th>
                  <th className="p-4 text-center font-medium">Free</th>
                  <th className="p-4 text-center font-medium">Starter</th>
                  <th className="p-4 text-center font-medium">Pro</th>
                  <th className="p-4 text-center font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {additionalFeatures.map((row, index) => (
                  <tr key={row.feature} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                    <td className="p-4 text-sm">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.free ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.starter ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.pro ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.enterprise ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                  and we&apos;ll prorate your billing accordingly.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my quota?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your API requests will be rate limited until your quota resets at the start of the next
                  billing cycle. You can upgrade your plan anytime to increase your quota.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The Free tier is free forever. Paid plans include a 14-day money-back guarantee,
                  so you can try them risk-free.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I cancel my subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You can cancel anytime from your dashboard. Your subscription will remain active until
                  the end of your billing period, then automatically downgrade to the Free tier.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-lg bg-muted px-6 py-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Still have questions?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Contact our sales team for custom Enterprise plans or technical questions.
          </p>
          <div className="mt-8">
            <Link href="/contact-sales">
              <Button size="lg">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
