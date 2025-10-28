export default function GetPDFPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Get PDF</h1>
        <p className="text-xl text-muted-foreground">
          Retrieve a generated PDF by its ID
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Endpoint</h2>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-semibold">GET</span>
            <span>https://api.speedstein.com/v1/pdf/{"{pdf_id}"}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Parameters</h2>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Parameter</th>
                <th className="px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-4 py-2 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-2 font-mono text-sm">pdf_id</td>
                <td className="px-4 py-2 text-sm">string</td>
                <td className="px-4 py-2 text-sm">The unique identifier of the PDF</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Response</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`{
  "success": true,
  "pdf": {
    "id": "pdf_1a2b3c4d",
    "download_url": "https://cdn.speedstein.com/pdf_1a2b3c4d.pdf",
    "created_at": "2025-10-27T12:00:00Z",
    "expires_at": "2025-11-03T12:00:00Z",
    "pages": 5,
    "size_bytes": 245760,
    "status": "ready"
  }
}`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Code Example</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`curl -X GET https://api.speedstein.com/v1/pdf/pdf_1a2b3c4d \
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
        </div>
      </section>
    </div>
  );
}
