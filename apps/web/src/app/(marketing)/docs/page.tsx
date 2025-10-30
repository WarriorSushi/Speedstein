/**
 * Docs Home Page - Introduction
 * Stripe-style documentation with code examples
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/code-block';
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
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 py-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Lightning Fast</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Sub-second PDF generation with optimized browser pooling
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Secure by Default</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enterprise-grade security with encrypted API keys
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Developer Friendly</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Simple REST API with comprehensive documentation
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Production Ready</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Built on Cloudflare's global network for reliability
          </p>
        </div>
      </div>

      {/* Quick Example */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Quick Example
        </h2>
        <p className="text-muted-foreground">
          Generate your first PDF in 30 seconds. Here&apos;s a minimal example:
        </p>

        <CodeBlock
          language="bash"
          code={`curl http://localhost:8787/api/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<h1>Hello World</h1>"
  }'`}
        />
      </div>

      {/* Response Example */}
      <div className="space-y-4">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Response</h3>
        <CodeBlock
          language="json"
          title="JSON Response"
          code={`{
  "success": true,
  "data": {
    "url": "https://cdn.speedstein.com/pdfs/...",
    "size": 45234,
    "generationTime": 1847
  },
  "requestId": "req_...",
  "quota": {
    "limit": 100,
    "used": 1,
    "remaining": 99,
    "percentage": 1
  }
}`}
        />
      </div>

      {/* API Endpoint */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          API Endpoint
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Link
                href="/docs/api/generate-pdf"
                className="hover:underline flex items-center justify-between"
              >
                POST /api/generate
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardTitle>
            <CardDescription>
              Generate a PDF from HTML with customizable options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Request:</strong> Send HTML content in the request body</p>
            <p><strong>Authentication:</strong> Bearer token (API key) required</p>
            <p><strong>Response:</strong> JSON with PDF URL, size, and generation time</p>
          </CardContent>
        </Card>
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
