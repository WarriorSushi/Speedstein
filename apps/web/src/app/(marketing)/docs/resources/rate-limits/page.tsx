export default function RateLimitsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Rate Limits</h1>
        <p className="text-xl text-muted-foreground">Understanding API rate limits and quotas</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Rate Limit Tiers</h2>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Tier</th>
                <th className="px-4 py-2 text-left font-semibold">Requests/Min</th>
                <th className="px-4 py-2 text-left font-semibold">Monthly Quota</th>
                <th className="px-4 py-2 text-left font-semibold">Concurrent Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-2 font-semibold">Free</td>
                <td className="px-4 py-2">10</td>
                <td className="px-4 py-2">100 PDFs</td>
                <td className="px-4 py-2">2</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold">Starter</td>
                <td className="px-4 py-2">60</td>
                <td className="px-4 py-2">1,000 PDFs</td>
                <td className="px-4 py-2">10</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold">Pro</td>
                <td className="px-4 py-2">300</td>
                <td className="px-4 py-2">10,000 PDFs</td>
                <td className="px-4 py-2">50</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold">Enterprise</td>
                <td className="px-4 py-2">Custom</td>
                <td className="px-4 py-2">Unlimited</td>
                <td className="px-4 py-2">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Response Headers</h2>
        <p>All API responses include rate limit information in headers:</p>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50">
          <pre>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698765432`}</pre>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Best Practices</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Implement exponential backoff when rate limited</li>
          <li>Use batch generation for multiple PDFs</li>
          <li>Cache generated PDFs to avoid regeneration</li>
          <li>Monitor rate limit headers and adjust request frequency</li>
        </ul>
      </section>
    </div>
  );
}
