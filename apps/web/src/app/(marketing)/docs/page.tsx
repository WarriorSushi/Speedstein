/**
 * Docs Home Page - Introduction
 * Stripe-style documentation with code examples
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, Shield, Code, Sparkles } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          Speedstein API Documentation
        </h1>
        <p className="text-xl text-muted-foreground">
          Generate high-quality PDFs from HTML in under 2 seconds. Built for developers who need
          speed, reliability, and simplicity.
        </p>
        <div className="flex gap-4 pt-2">
          <Button size="lg" asChild>
            <Link href="/docs/quickstart">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/docs/api/generate-pdf">View API Reference</Link>
          </Button>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Lightning Fast</CardTitle>
            <CardDescription>
              Generate PDFs in under 2 seconds with our optimized browser pooling
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Secure by Default</CardTitle>
            <CardDescription>
              SHA-256 hashed API keys and row-level security on all data
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Code className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Developer Friendly</CardTitle>
            <CardDescription>
              Simple REST API with SDKs for Node.js, Python, PHP, and Ruby
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Sparkles className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Production Ready</CardTitle>
            <CardDescription>
              99.9% uptime SLA with automatic failover and monitoring
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Example */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Quick Example
        </h2>
        <p className="text-muted-foreground">
          Generate your first PDF in 30 seconds. Here&apos;s a minimal example:
        </p>

        <div className="rounded-lg border bg-muted/50 overflow-hidden">
          <div className="border-b bg-muted px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm font-mono text-muted-foreground">Terminal</span>
            </div>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono">{`curl https://api.speedstein.com/v1/pdf/generate \\
  -H "Authorization: Bearer sk_test_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<h1>Hello World</h1>",
    "format": "A4"
  }'`}</code>
          </pre>
        </div>
      </div>

      {/* Response Example */}
      <div className="space-y-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Response</h3>
        <div className="rounded-lg border bg-muted/50 overflow-hidden">
          <div className="border-b bg-muted px-4 py-2">
            <span className="text-sm font-mono text-muted-foreground">JSON Response</span>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono">{`{
  "id": "pdf_1a2b3c4d5e6f",
  "url": "https://storage.speedstein.com/pdfs/1a2b3c4d5e6f.pdf",
  "size": 45234,
  "pages": 1,
  "generation_time_ms": 1847,
  "created_at": "2025-10-28T12:34:56Z",
  "expires_at": "2025-11-04T12:34:56Z"
}`}</code>
          </pre>
        </div>
      </div>

      {/* Popular Endpoints */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Popular API Endpoints
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Link
                  href="/docs/api/generate-pdf"
                  className="hover:underline flex items-center justify-between"
                >
                  POST /v1/pdf/generate
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardTitle>
              <CardDescription>
                Generate a PDF from HTML, URL, or Markdown with custom formatting options
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Link
                  href="/docs/api/batch-generate"
                  className="hover:underline flex items-center justify-between"
                >
                  POST /v1/pdf/batch
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardTitle>
              <CardDescription>
                Generate multiple PDFs in a single request with promise pipelining
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Link
                  href="/docs/api/get-pdf"
                  className="hover:underline flex items-center justify-between"
                >
                  GET /v1/pdf/:id
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardTitle>
              <CardDescription>
                Retrieve a previously generated PDF by its ID
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Link
                  href="/docs/api/list-pdfs"
                  className="hover:underline flex items-center justify-between"
                >
                  GET /v1/pdf/list
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardTitle>
              <CardDescription>
                List all PDFs with pagination and filtering options
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Next Steps
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>1. Get Your API Key</CardTitle>
              <CardDescription>
                Sign up for free and generate your first API key in the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/signup">Sign Up Free</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Follow the Quickstart</CardTitle>
              <CardDescription>
                Step-by-step guide to generate your first PDF in 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/docs/quickstart">View Quickstart</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Explore Examples</CardTitle>
              <CardDescription>
                Browse code examples in your favorite programming language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/docs/examples">View Examples</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Support CTA */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Our team is here to help you get started and answer any questions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="secondary" asChild>
            <Link href="mailto:support@speedstein.com">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/resources/errors">View Error Codes</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
