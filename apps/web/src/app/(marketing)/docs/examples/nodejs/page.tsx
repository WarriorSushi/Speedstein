export default function NodeJSExamplesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Node.js Examples</h1>
        <p className="text-xl text-muted-foreground">Complete Node.js integration examples for Speed stein PDF API</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50"><pre>npm install node-fetch</pre></div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Basic Usage</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`const fetch = require('node-fetch');

async function generatePDF() {
  const response = await fetch('https://api.speedstein.com/v1/pdf/generate', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.SPEEDSTEIN_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: '<html><body><h1>Hello PDF!</h1></body></html>',
      options: {
        format: 'A4',
        orientation: 'portrait'
      }
    })
  });

  const data = await response.json();
  console.log('PDF generated:', data.download_url);
}

generatePDF();`}</pre>
        </div>
      </section>
    </div>
  );
}
