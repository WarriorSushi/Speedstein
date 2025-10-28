export default function RubyExamplesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Ruby Examples</h1>
        <p className="text-xl text-muted-foreground">Complete Ruby integration examples</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-50"><pre>gem install httparty</pre></div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Basic Usage</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`require 'httparty'

def generate_pdf
  api_key = ENV['SPEEDSTEIN_API_KEY']
  response = HTTParty.post(
    'https://api.speedstein.com/v1/pdf/generate',
    headers: { 'Authorization' => "Bearer #{api_key}" },
    body: {
      html: '<html><body><h1>Hello PDF!</h1></body></html>',
      options: { format: 'A4' }
    }.to_json
  )
  puts "PDF generated: #{response['download_url']}"
end

generate_pdf`}</pre>
        </div>
      </section>
    </div>
  );
}
