export default function ChangelogPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Changelog</h1>
        <p className="text-xl text-muted-foreground">Product updates and API changes</p>
      </div>
      <section className="space-y-6">
        <div className="border-l-4 border-primary pl-4 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">v1.0.0</h3>
            <span className="text-sm text-muted-foreground">October 27, 2025</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>Initial public release</li>
            <li>PDF generation API with sub-2s latency</li>
            <li>Batch generation support</li>
            <li>RESTful API and WebSocket RPC</li>
            <li>Four subscription tiers</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
