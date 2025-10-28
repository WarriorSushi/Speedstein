export default function DeletePDFPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Delete PDF</h1>
        <p className="text-xl text-muted-foreground">Permanently delete a PDF from storage</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Endpoint</h2>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50">
          <div className="flex items-center gap-2"><span className="text-red-400 font-semibold">DELETE</span><span>https://api.speedstein.com/v1/pdf/{"{pdf_id}"}</span></div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Code Example</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`curl -X DELETE https://api.speedstein.com/v1/pdf/pdf_1a2b3c4d \
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
        </div>
      </section>
    </div>
  );
}
