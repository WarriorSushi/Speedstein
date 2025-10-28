/**
 * API Documentation - Batch Generate PDFs
 * Comprehensive documentation for batch PDF generation endpoint
 */

export default function BatchGeneratePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Batch Generate PDFs</h1>
        <p className="text-xl text-muted-foreground">
          Generate multiple PDFs in a single API request for improved efficiency
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p>
          The batch generate endpoint allows you to create multiple PDFs in a single API call.
          This is significantly more efficient than making individual requests, reducing overhead
          and improving throughput.
        </p>
        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm">
            <strong>Performance tip:</strong> Batch generation uses promise pipelining internally
            to process PDFs in parallel, achieving up to 10x faster processing compared to
            sequential individual requests.
          </p>
        </div>
      </section>

      {/* Endpoint */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Endpoint</h2>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-semibold">POST</span>
            <span>https://api.speedstein.com/v1/pdf/batch</span>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Authentication</h2>
        <p>This endpoint requires API key authentication via the Authorization header.</p>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50">
          <pre>{`Authorization: Bearer YOUR_API_KEY`}</pre>
        </div>
      </section>

      {/* Request Body */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Request Body</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`{
  "pdfs": [
    {
      "html": "<html>...</html>",
      "options": {
        "format": "A4",
        "orientation": "portrait",
        "margin": { "top": "1cm", "bottom": "1cm" }
      },
      "metadata": {
        "filename": "invoice-001.pdf",
        "reference_id": "inv_001"
      }
    },
    {
      "html": "<html>...</html>",
      "options": { "format": "Letter" },
      "metadata": {
        "filename": "invoice-002.pdf",
        "reference_id": "inv_002"
      }
    }
  ]
}`}</pre>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Parameters</h3>
          <div className="rounded-lg border">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Parameter</th>
                  <th className="px-4 py-2 text-left font-semibold">Type</th>
                  <th className="px-4 py-2 text-left font-semibold">Required</th>
                  <th className="px-4 py-2 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2 font-mono text-sm">pdfs</td>
                  <td className="px-4 py-2 text-sm">array</td>
                  <td className="px-4 py-2 text-sm">Yes</td>
                  <td className="px-4 py-2 text-sm">Array of PDF generation requests (max 100)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-sm">pdfs[].html</td>
                  <td className="px-4 py-2 text-sm">string</td>
                  <td className="px-4 py-2 text-sm">Yes</td>
                  <td className="px-4 py-2 text-sm">HTML content to convert to PDF</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-sm">pdfs[].options</td>
                  <td className="px-4 py-2 text-sm">object</td>
                  <td className="px-4 py-2 text-sm">No</td>
                  <td className="px-4 py-2 text-sm">PDF generation options (format, orientation, margins)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-sm">pdfs[].metadata</td>
                  <td className="px-4 py-2 text-sm">object</td>
                  <td className="px-4 py-2 text-sm">No</td>
                  <td className="px-4 py-2 text-sm">Custom metadata for tracking and identification</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Response */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Response</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`{
  "success": true,
  "results": [
    {
      "success": true,
      "pdf_id": "pdf_1a2b3c4d",
      "download_url": "https://cdn.speedstein.com/pdf_1a2b3c4d.pdf",
      "pages": 5,
      "size_bytes": 245760,
      "metadata": {
        "filename": "invoice-001.pdf",
        "reference_id": "inv_001"
      }
    },
    {
      "success": true,
      "pdf_id": "pdf_5e6f7g8h",
      "download_url": "https://cdn.speedstein.com/pdf_5e6f7g8h.pdf",
      "pages": 3,
      "size_bytes": 189440,
      "metadata": {
        "filename": "invoice-002.pdf",
        "reference_id": "inv_002"
      }
    }
  ],
  "total": 2,
  "successful": 2,
  "failed": 0,
  "processing_time_ms": 1850
}`}</pre>
        </div>
      </section>

      {/* Code Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Code Examples</h2>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">cURL</h3>
          <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
            <pre className="font-mono text-sm text-slate-50">{`curl -X POST https://api.speedstein.com/v1/pdf/batch \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pdfs": [
      {
        "html": "<html><body><h1>Invoice #001</h1></body></html>",
        "options": { "format": "A4" },
        "metadata": { "reference_id": "inv_001" }
      },
      {
        "html": "<html><body><h1>Invoice #002</h1></body></html>",
        "options": { "format": "A4" },
        "metadata": { "reference_id": "inv_002" }
      }
    ]
  }'`}</pre>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Node.js</h3>
          <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
            <pre className="font-mono text-sm text-slate-50">{`const response = await fetch('https://api.speedstein.com/v1/pdf/batch', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.SPEEDSTEIN_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pdfs: [
      {
        html: '<html><body><h1>Invoice #001</h1></body></html>',
        options: { format: 'A4' },
        metadata: { reference_id: 'inv_001' }
      },
      {
        html: '<html><body><h1>Invoice #002</h1></body></html>',
        options: { format: 'A4' },
        metadata: { reference_id: 'inv_002' }
      }
    ]
  })
});

const result = await response.json();
console.log(\`Generated \${result.successful} PDFs in \${result.processing_time_ms}ms\`);`}</pre>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Rate Limits</h2>
        <p>Batch generation requests count towards your quota based on the number of PDFs generated.</p>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Tier</th>
                <th className="px-4 py-2 text-left font-semibold">Max PDFs per Batch</th>
                <th className="px-4 py-2 text-left font-semibold">Rate Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-2">Free</td>
                <td className="px-4 py-2">10 PDFs</td>
                <td className="px-4 py-2">10 requests/minute</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Starter</td>
                <td className="px-4 py-2">50 PDFs</td>
                <td className="px-4 py-2">60 requests/minute</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Pro</td>
                <td className="px-4 py-2">100 PDFs</td>
                <td className="px-4 py-2">300 requests/minute</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Enterprise</td>
                <td className="px-4 py-2">Unlimited</td>
                <td className="px-4 py-2">Custom</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Error Handling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Error Handling</h2>
        <p>
          If any PDFs fail to generate, the batch request will still succeed with partial results.
          Check the <code className="bg-muted px-1 py-0.5 rounded">success</code> field for each result.
        </p>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`{
  "success": true,
  "results": [
    {
      "success": true,
      "pdf_id": "pdf_1a2b3c4d",
      "download_url": "https://cdn.speedstein.com/pdf_1a2b3c4d.pdf"
    },
    {
      "success": false,
      "error": {
        "code": "INVALID_HTML",
        "message": "Malformed HTML content"
      }
    }
  ],
  "total": 2,
  "successful": 1,
  "failed": 1
}`}</pre>
        </div>
      </section>
    </div>
  );
}
