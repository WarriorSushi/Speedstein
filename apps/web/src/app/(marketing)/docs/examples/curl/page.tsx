export default function CurlExamplesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">cURL Examples</h1>
        <p className="text-xl text-muted-foreground">Complete cURL command examples for testing</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Generate PDF</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`curl -X POST https://api.speedstein.com/v1/pdf/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Hello PDF!</h1></body></html>",
    "options": {"format": "A4"}
  }'`}</pre>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Batch Generate</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`curl -X POST https://api.speedstein.com/v1/pdf/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pdfs": [
      {"html": "<html><body><h1>PDF 1</h1></body></html>"},
      {"html": "<html><body><h1>PDF 2</h1></body></html>"}
    ]
  }'`}</pre>
        </div>
      </section>
    </div>
  );
}
