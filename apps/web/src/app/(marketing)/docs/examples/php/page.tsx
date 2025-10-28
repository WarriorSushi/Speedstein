export default function PHPExamplesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">PHP Examples</h1>
        <p className="text-xl text-muted-foreground">Complete PHP integration examples</p>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Basic Usage</h2>
        <div className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
          <pre className="font-mono text-sm text-slate-50">{`<?php

$api_key = getenv('SPEEDSTEIN_API_KEY');

$data = [
    'html' => '<html><body><h1>Hello PDF!</h1></body></html>',
    'options' => ['format' => 'A4']
];

$ch = curl_init('https://api.speedstein.com/v1/pdf/generate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $api_key,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$result = json_decode($response, true);

echo "PDF generated: " . $result['download_url'];
?>`}</pre>
        </div>
      </section>
    </div>
  );
}
