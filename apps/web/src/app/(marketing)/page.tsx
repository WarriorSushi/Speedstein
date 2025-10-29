'use client'

/**
 * Landing Page
 *
 * Marketing homepage with hero section, live Monaco editor demo, and pricing tiers.
 * Optimized for LCP <2s (Constitution Principle I & VII).
 *
 * Performance Optimizations:
 * - Monaco Editor dynamically imported (code splitting)
 * - Above-the-fold content prioritized
 * - OKLCH colors for minimal CSS footprint
 * - Responsive breakpoints: 640/768/1024/1280px
 *
 * Constitution Compliance:
 * - Principle I: Performance optimized for <2s LCP
 * - Principle III: OKLCH design system, shadcn/ui components
 * - Principle VII: Mobile-responsive, works without auth
 *
 * @packageDocumentation
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MonacoDemo } from '@/components/monaco-demo'
import { useWebSocketRpc } from '@/hooks/use-websocket-rpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Shield, Code, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastRestTime, setLastRestTime] = useState<number | null>(null)
  const [lastRpcTime, setLastRpcTime] = useState<number | null>(null)

  // WebSocket RPC client
  const workerUrl = typeof window !== 'undefined' ? `http://localhost:8787` : ''
  const { connectionState, connect, generatePdf: generatePdfRpc } = useWebSocketRpc(workerUrl)

  // Don't auto-connect - only connect when user clicks WebSocket button
  // This prevents console errors when worker isn't running
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     connect().catch(err => console.error('[RPC] Auto-connect failed:', err))
  //   }
  // }, [connect])

  // REST API handler
  const handleGenerateRest = async (html: string) => {
    setIsGenerating(true)
    const startTime = Date.now()

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html }),
      })

      if (!response.ok) {
        throw new Error('PDF generation failed')
      }

      // Extract generation time from headers (worker processing time)
      const generationTimeHeader = response.headers.get('X-Generation-Time')
      const generationTime = generationTimeHeader ? parseInt(generationTimeHeader, 10) : null

      const totalTime = Date.now() - startTime

      // Store generation time
      if (generationTime) {
        setLastRestTime(generationTime)
        console.log(`[REST] PDF generated in ${generationTime}ms (total ${totalTime}ms with network overhead)`)
      } else {
        setLastRestTime(totalTime)
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `speedstein-rest-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('[REST] Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // WebSocket RPC handler
  const handleGenerateRpc = async (html: string) => {
    setIsGenerating(true)
    const startTime = Date.now()

    try {
      // Connect first if not connected
      if (connectionState !== 'connected') {
        await connect()
      }

      const result = await generatePdfRpc(html)
      console.log('[RPC] Received result:', result)

      const totalTime = Date.now() - startTime

      if (!result.success) {
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'PDF generation failed'
        throw new Error(errorMessage)
      }

      // Extract data from result (RPC returns { success, data: { url, size, generationTime, ... } })
      const data = result.data || result
      const generationTime = data.generationTime || totalTime
      setLastRpcTime(generationTime)
      console.log(`[RPC] PDF generated in ${generationTime}ms (total ${totalTime}ms)`)

      // Download the PDF from buffer or URL
      if (data.pdfBuffer) {
        const pdfBlob = new Blob([new Uint8Array(data.pdfBuffer)], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `speedstein-rpc-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (data.url) {
        // Fallback: download from URL
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('[RPC] Failed to generate PDF:', error)
      alert(`Failed to generate PDF via RPC: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="w-full space-y-6 py-12 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center px-4">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-3 w-3" />
            P95 latency under 2 seconds
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Lightning-Fast
            <br className="hidden sm:inline" />
            {' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PDF Generation API
            </span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Generate beautiful PDFs from HTML in under 2 seconds. Simple RESTful API with no setup required.
            Start for free, scale to millions.
          </p>
          <div className="flex gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="gap-2">
                <Code className="h-4 w-4" />
                View Docs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="w-full py-12 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-[64rem] space-y-6 px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <Badge variant="outline">No Signup Required</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Try It Live
            </h2>
            <p className="max-w-[42rem] text-muted-foreground sm:text-lg">
              Edit the HTML below and generate a PDF instantly. Experience the speed firsthand.
            </p>
          </div>
          <MonacoDemo
            onGenerateRest={handleGenerateRest}
            onGenerateRpc={handleGenerateRpc}
            isGenerating={isGenerating}
            lastRestTime={lastRestTime}
            lastRpcTime={lastRpcTime}
            rpcConnectionState={connectionState}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24">
        <div className="mx-auto max-w-[64rem] space-y-12 px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose Speedstein?
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary" />
                <CardTitle>Blazing Fast</CardTitle>
                <CardDescription>
                  P95 latency under 2 seconds. Browser session pooling ensures consistent performance.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary" />
                <CardTitle>Enterprise Ready</CardTitle>
                <CardDescription>
                  99.9% uptime SLA, SHA-256 hashed API keys, and comprehensive error tracking.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Code className="h-10 w-10 text-primary" />
                <CardTitle>Developer Friendly</CardTitle>
                <CardDescription>
                  Simple RESTful API with SDK support for JavaScript, Python, PHP, and Ruby.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Preview */}
      <section className="w-full py-12 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-[64rem] space-y-12 px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[42rem] text-muted-foreground sm:text-lg">
              Start for free. Upgrade as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Perfect for testing',
                features: ['100 PDFs/month', '10 pages max', '7 day retention'],
              },
              {
                name: 'Starter',
                price: '$29',
                description: 'For small projects',
                features: ['1,000 PDFs/month', '50 pages max', '30 day retention'],
              },
              {
                name: 'Pro',
                price: '$99',
                description: 'For growing businesses',
                features: ['10,000 PDFs/month', '200 pages max', '90 day retention'],
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large scale',
                features: ['100,000+ PDFs/month', '1000 pages max', '365 day retention'],
              },
            ].map((tier) => (
              <Card key={tier.name} className={tier.highlight ? 'border-primary' : ''}>
                <CardHeader>
                  {tier.highlight && (
                    <Badge className="w-fit">Most Popular</Badge>
                  )}
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/signup" className="w-full">
                    <Button variant={tier.highlight ? 'default' : 'outline'} className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Link href="/pricing">
              <Button variant="ghost" size="lg">
                See Full Pricing Details →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 px-4">
        <div className="mx-auto max-w-[64rem] rounded-lg bg-muted px-6 py-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Join thousands of developers generating millions of PDFs every month.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
