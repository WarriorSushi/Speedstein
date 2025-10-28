/**
 * API Reference - Generate PDF
 * Complete documentation for the PDF generation endpoint
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function GeneratePdfApiPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="default" className="bg-green-600">POST</Badge>
          <code className="text-2xl font-mono">/v1/pdf/generate</code>
        </div>
        <p className="text-xl text-muted-foreground">
          Generate a PDF from HTML, URL, or Markdown
        </p>
      </div>

      {/* Quick Example */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Quick Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background overflow-hidden">
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono">{`curl -X POST https://api.speedstein.com/v1/pdf/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<html><body><h1>Hello World</h1></body></html>",
    "format": "A4",
    "margin": "1cm"
  }' \\
  --output document.pdf`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Request */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Request
        </h2>

        <div className="space-y-6">
          {/* Headers */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Headers</h3>
            <div className="rounded-lg border">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Header</th>
                    <th className="p-3 text-left font-medium">Value</th>
                    <th className="p-3 text-left font-medium">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3"><code className="text-sm">Authorization</code></td>
                    <td className="p-3"><code className="text-sm">Bearer YOUR_API_KEY</code></td>
                    <td className="p-3"><Badge variant="destructive">Required</Badge></td>
                  </tr>
                  <tr>
                    <td className="p-3"><code className="text-sm">Content-Type</code></td>
                    <td className="p-3"><code className="text-sm">application/json</code></td>
                    <td className="p-3"><Badge variant="destructive">Required</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Body Parameters */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Body Parameters</h3>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">html</CardTitle>
                      <CardDescription>string</CardDescription>
                    </div>
                    <Badge variant="destructive">Required*</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The HTML content to convert to PDF. Must be valid HTML5. Use this OR <code>url</code> (not both).
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"html": "<html><body><h1>Title</h1><p>Content</p></body></html>"`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">url</CardTitle>
                      <CardDescription>string</CardDescription>
                    </div>
                    <Badge variant="destructive">Required*</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    URL to convert to PDF. Must be publicly accessible. Use this OR <code>html</code> (not both).
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"url": "https://example.com/page-to-convert"`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">format</CardTitle>
                      <CardDescription>string</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Page format. Default: <code>A4</code>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">A4</Badge>
                    <Badge variant="outline">A3</Badge>
                    <Badge variant="outline">A5</Badge>
                    <Badge variant="outline">Letter</Badge>
                    <Badge variant="outline">Legal</Badge>
                    <Badge variant="outline">Tabloid</Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"format": "A4"`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">margin</CardTitle>
                      <CardDescription>string | object</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Page margins. Can be a single value (all sides) or an object with top, right, bottom, left.
                  </p>
                  <div className="space-y-2">
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <code className="text-xs">{`"margin": "1cm"  // All sides`}</code>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <code className="text-xs">{`"margin": {
  "top": "2cm",
  "right": "1.5cm",
  "bottom": "2cm",
  "left": "1.5cm"
}`}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">orientation</CardTitle>
                      <CardDescription>string</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Page orientation. Default: <code>portrait</code>
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline">portrait</Badge>
                    <Badge variant="outline">landscape</Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"orientation": "landscape"`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">print_background</CardTitle>
                      <CardDescription>boolean</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Print background graphics. Default: <code>true</code>
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"print_background": true`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">scale</CardTitle>
                      <CardDescription>number</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Scale of the webpage rendering. Range: 0.1 to 2. Default: <code>1</code>
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"scale": 1.2`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">wait_for</CardTitle>
                      <CardDescription>string</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Wait condition before generating PDF:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline">load</Badge>
                    <Badge variant="outline">domcontentloaded</Badge>
                    <Badge variant="outline">networkidle0</Badge>
                    <Badge variant="outline">networkidle2</Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <code className="text-xs">{`"wait_for": "networkidle0"`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">header_html</CardTitle>
                      <CardDescription>string</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    HTML template for page header. Supports variables: <code>{'{{pageNumber}}'}</code>, <code>{'{{totalPages}}'}</code>, <code>{'{{date}}'}</code>
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"header_html": "<div style='font-size:10px;text-align:center'>Page {{pageNumber}}</div>"`}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">footer_html</CardTitle>
                      <CardDescription>string</CardDescription>
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    HTML template for page footer. Supports same variables as header.
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 mt-2">
                    <code className="text-xs">{`"footer_html": "<div style='font-size:9px;text-align:right'>{{pageNumber}} of {{totalPages}}</div>"`}</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Response */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Response
        </h2>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">200</Badge>
              <CardTitle>Success</CardTitle>
            </div>
            <CardDescription>PDF generated successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{`{
  "id": "pdf_1a2b3c4d5e6f",
  "url": "https://storage.speedstein.com/pdfs/1a2b3c4d5e6f.pdf",
  "size": 45234,
  "pages": 3,
  "format": "A4",
  "generation_time_ms": 1847,
  "created_at": "2025-10-28T12:34:56Z",
  "expires_at": "2025-11-04T12:34:56Z"
}`}</code>
              </pre>
            </div>

            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Response Fields</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><code>id</code> - Unique identifier for the PDF</li>
                <li><code>url</code> - Download URL (valid until expiration)</li>
                <li><code>size</code> - File size in bytes</li>
                <li><code>pages</code> - Number of pages in the PDF</li>
                <li><code>format</code> - Page format used</li>
                <li><code>generation_time_ms</code> - Time taken to generate PDF in milliseconds</li>
                <li><code>created_at</code> - ISO 8601 timestamp of creation</li>
                <li><code>expires_at</code> - ISO 8601 timestamp when URL expires (7-365 days based on tier)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Responses */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Error Responses
        </h2>

        <div className="space-y-4">
          <Card className="border-red-500/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">400</Badge>
                <CardTitle>Bad Request</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-4">
                <code className="text-sm font-mono">{`{
  "error": {
    "code": "invalid_request",
    "message": "Either 'html' or 'url' parameter is required"
  }
}`}</code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">401</Badge>
                <CardTitle>Unauthorized</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-4">
                <code className="text-sm font-mono">{`{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or missing API key"
  }
}`}</code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">429</Badge>
                <CardTitle>Rate Limit Exceeded</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-4">
                <code className="text-sm font-mono">{`{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retry_after": 60
  }
}`}</code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">402</Badge>
                <CardTitle>Quota Exceeded</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-4">
                <code className="text-sm font-mono">{`{
  "error": {
    "code": "quota_exceeded",
    "message": "Monthly quota exceeded. Upgrade your plan or wait for reset.",
    "quota_reset_at": "2025-11-01T00:00:00Z"
  }
}`}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Complete Examples
        </h2>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Performance Tip</AlertTitle>
          <AlertDescription>
            For best performance (&lt;2s generation time), keep your HTML under 1MB and avoid loading external resources that may cause network delays.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Node.js with async/await</h3>
            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{`const fetch = require('node-fetch');
const fs = require('fs').promises;

async function generatePDF() {
  try {
    const response = await fetch('https://api.speedstein.com/v1/pdf/generate', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.SPEEDSTEIN_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: '<html><body><h1>Invoice #12345</h1></body></html>',
        format: 'A4',
        margin: '1cm',
        print_background: true,
        footer_html: '<div style="font-size:9px;text-align:center">{{pageNumber}}</div>'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`API Error: \${error.error.message}\`);
    }

    const metadata = await response.json();
    console.log('PDF generated:', metadata);

    // Download the PDF
    const pdfResponse = await fetch(metadata.url);
    const buffer = await pdfResponse.buffer();
    await fs.writeFile('invoice.pdf', buffer);

    console.log(\`Saved as invoice.pdf (\${metadata.size} bytes, \${metadata.pages} pages)\`);
  } catch (error) {
    console.error('Error generating PDF:', error.message);
  }
}

generatePDF();`}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Python with requests</h3>
            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{`import os
import requests

def generate_pdf():
    response = requests.post(
        'https://api.speedstein.com/v1/pdf/generate',
        headers={
            'Authorization': f'Bearer {os.environ["SPEEDSTEIN_API_KEY"]}',
            'Content-Type': 'application/json'
        },
        json={
            'html': '<html><body><h1>Report</h1></body></html>',
            'format': 'A4',
            'margin': '2cm',
            'orientation': 'portrait',
            'print_background': True
        }
    )

    if response.status_code != 200:
        print(f"Error: {response.json()['error']['message']}")
        return

    metadata = response.json()
    print(f"PDF generated: {metadata['id']}")

    # Download the PDF
    pdf_response = requests.get(metadata['url'])
    with open('report.pdf', 'wb') as f:
        f.write(pdf_response.content)

    print(f"Saved as report.pdf ({metadata['size']} bytes)")

if __name__ == '__main__':
    generate_pdf()`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
