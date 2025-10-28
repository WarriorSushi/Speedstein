export default function PythonExamplesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Python Examples</h1>
        <p className="text-xl text-muted-foreground">Complete Python integration examples</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50"><pre>pip install requests</pre></div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Basic Usage</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`import requests
import os

def generate_pdf():
    api_key = os.environ.get('SPEEDSTEIN_API_KEY')
    response = requests.post(
        'https://api.speedstein.com/v1/pdf/generate',
        headers={'Authorization': f'Bearer {api_key}'},
        json={
            'html': '<html><body><h1>Hello PDF!</h1></body></html>',
            'options': {'format': 'A4'}
        }
    )
    data = response.json()
    print(f"PDF generated: {data['download_url']}")

generate_pdf()`}</pre>
        </div>
      </section>
    </div>
  );
}
