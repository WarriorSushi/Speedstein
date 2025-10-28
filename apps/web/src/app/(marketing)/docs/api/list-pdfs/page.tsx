export default function ListPDFsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">List PDFs</h1>
        <p className="text-xl text-muted-foreground">Retrieve a paginated list of your generated PDFs</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Endpoint</h2>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50">
          <div className="flex items-center gap-2"><span className="text-blue-400 font-semibold">GET</span><span>https://api.speedstein.com/v1/pdf</span></div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Query Parameters</h2>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr><th className="px-4 py-2 text-left font-semibold">Parameter</th><th className="px-4 py-2 text-left font-semibold">Type</th><th className="px-4 py-2 text-left font-semibold">Description</th></tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="px-4 py-2 font-mono text-sm">limit</td><td className="px-4 py-2 text-sm">number</td><td className="px-4 py-2 text-sm">Number of results (max 100, default 20)</td></tr>
              <tr><td className="px-4 py-2 font-mono text-sm">offset</td><td className="px-4 py-2 text-sm">number</td><td className="px-4 py-2 text-sm">Pagination offset (default 0)</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
