export default function WebhooksPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Webhooks</h1>
        <p className="text-xl text-muted-foreground">Real-time notifications for PDF generation events</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p>Webhooks allow you to receive real-time notifications when PDF generation completes. Available on Starter plans and above.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Webhook Events</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><code className="bg-muted px-1 py-0.5 rounded">pdf.generated</code> - PDF generation successful</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">pdf.failed</code> - PDF generation failed</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">quota.warning</code> - 80% of monthly quota reached</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Payload Example</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`{
  "event": "pdf.generated",
  "timestamp": "2025-10-27T12:00:00Z",
  "data": {
    "pdf_id": "pdf_1a2b3c4d",
    "download_url": "https://cdn.speedstein.com/pdf_1a2b3c4d.pdf",
    "pages": 5,
    "size_bytes": 245760
  }
}`}</pre>
        </div>
      </section>
    </div>
  );
}
