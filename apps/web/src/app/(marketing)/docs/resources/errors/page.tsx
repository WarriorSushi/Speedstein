export default function ErrorsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Error Codes</h1>
        <p className="text-xl text-muted-foreground">Complete reference for API error codes</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">HTTP Status Codes</h2>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Code</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="px-4 py-2 font-mono">200</td><td className="px-4 py-2">OK</td><td className="px-4 py-2">Request successful</td></tr>
              <tr><td className="px-4 py-2 font-mono">400</td><td className="px-4 py-2">Bad Request</td><td className="px-4 py-2">Invalid parameters</td></tr>
              <tr><td className="px-4 py-2 font-mono">401</td><td className="px-4 py-2">Unauthorized</td><td className="px-4 py-2">Invalid or missing API key</td></tr>
              <tr><td className="px-4 py-2 font-mono">403</td><td className="px-4 py-2">Forbidden</td><td className="px-4 py-2">Quota exceeded</td></tr>
              <tr><td className="px-4 py-2 font-mono">429</td><td className="px-4 py-2">Too Many Requests</td><td className="px-4 py-2">Rate limit exceeded</td></tr>
              <tr><td className="px-4 py-2 font-mono">500</td><td className="px-4 py-2">Internal Server Error</td><td className="px-4 py-2">Server error</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Error Response Format</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`{
  "success": false,
  "error": {
    "code": "INVALID_HTML",
    "message": "Malformed HTML content",
    "details": {
      "line": 42,
      "column": 10
    }
  }
}`}</pre>
        </div>
      </section>
    </div>
  );
}
