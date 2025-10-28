/**
 * Quickstart Guide
 * Step-by-step guide to generate your first PDF
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

export default function QuickstartPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Quickstart Guide</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Generate your first PDF in 5 minutes
        </p>
      </div>

      {/* Step 1 */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            1
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Create an Account</h2>
            <p className="text-muted-foreground mt-2">
              Sign up for a free account to get started. No credit card required.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/signup">Sign Up Free</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            2
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Generate an API Key</h2>
              <p className="text-muted-foreground mt-2">
                Navigate to the <Link href="/dashboard/api-keys" className="underline">API Keys</Link> page in your dashboard and create a new key.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Key Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted p-4">
                  <code className="text-sm font-mono">sk_free_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6</code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  <Badge variant="destructive" className="mr-2">Important</Badge>
                  Save your API key securely. It won&apos;t be shown again!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            3
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Make Your First API Call</h2>
              <p className="text-muted-foreground mt-2">
                Use cURL or your favorite HTTP client to generate a PDF:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>cURL</Badge>
                </div>
                <div className="rounded-lg border bg-muted/50 overflow-hidden">
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm font-mono">{`curl -X POST https://api.speedstein.com/v1/pdf/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<html><body><h1>My First PDF</h1><p>Generated with Speedstein!</p></body></html>",
    "format": "A4",
    "margin": "1cm"
  }' \\
  --output my-first.pdf`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>Node.js</Badge>
                </div>
                <div className="rounded-lg border bg-muted/50 overflow-hidden">
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm font-mono">{`const fetch = require('node-fetch');
const fs = require('fs');

async function generatePDF() {
  const response = await fetch('https://api.speedstein.com/v1/pdf/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: '<html><body><h1>My First PDF</h1></body></html>',
      format: 'A4',
      margin: '1cm'
    })
  });

  const buffer = await response.buffer();
  fs.writeFileSync('my-first.pdf', buffer);
  console.log('PDF generated successfully!');
}

generatePDF();`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>Python</Badge>
                </div>
                <div className="rounded-lg border bg-muted/50 overflow-hidden">
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm font-mono">{`import requests

response = requests.post(
    'https://api.speedstein.com/v1/pdf/generate',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'html': '<html><body><h1>My First PDF</h1></body></html>',
        'format': 'A4',
        'margin': '1cm'
    }
)

with open('my-first.pdf', 'wb') as f:
    f.write(response.content)

print('PDF generated successfully!')`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            4
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Verify the Response</h2>
              <p className="text-muted-foreground mt-2">
                You should receive a successful response with metadata about your PDF:
              </p>
            </div>

            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <div className="border-b bg-muted px-4 py-2">
                <span className="text-sm font-mono text-muted-foreground">Response (200 OK)</span>
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

            <Card className="border-green-500/50 bg-green-500/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Success!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your PDF was generated in under 2 seconds. Download it from the <code>url</code> field.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="border-t pt-8 space-y-4">
        <h2 className="text-2xl font-semibold">Next Steps</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Explore Advanced Features</CardTitle>
              <CardDescription>
                Learn about custom headers, footers, page numbers, and watermarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/docs/api/generate-pdf">View API Reference</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Try Batch Generation</CardTitle>
              <CardDescription>
                Generate multiple PDFs in parallel with our batch API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/docs/api/batch-generate">View Batch API</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>View Code Examples</CardTitle>
              <CardDescription>
                Complete examples in Node.js, Python, PHP, Ruby, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/docs/examples">Browse Examples</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check Rate Limits</CardTitle>
              <CardDescription>
                Understand rate limits and quotas for your subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/docs/resources/rate-limits">View Rate Limits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
