# Quickstart Guide: Speedstein PDF API

**Welcome!** This guide will help you generate your first PDF in under 5 minutes.

## Prerequisites

- Speedstein account ([sign up for free](https://speedstein.com/signup))
- API key from your [dashboard](https://speedstein.com/dashboard/api-keys)
- HTTP client (cURL, Postman, or code in your preferred language)

## Step 1: Get Your API Key

1. Log in to your [Speedstein dashboard](https://speedstein.com/dashboard)
2. Navigate to **API Keys** in the sidebar
3. Click **"Create API Key"**
4. Enter a descriptive name (e.g., "My First Key")
5. **Copy the API key** - you won't be able to see it again!

Your API key will look like this: `sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

## Step 2: Generate Your First PDF

### Using cURL

```bash
curl -X POST https://api.speedstein.com/api/generate \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Hello, World!</h1><p>This is my first PDF from Speedstein.</p></body></html>"
  }'
```

### Response

```json
{
  "success": true,
  "url": "https://cdn.speedstein.com/pdfs/7f3a9b2c-4d1e-4a5b-8c6d-9e2f1a3b4c5d.pdf",
  "generationTime": 1247,
  "size": 15423,
  "expiresAt": "2025-11-24T10:30:00.000Z"
}
```

**Congratulations!** 🎉 You just generated your first PDF. Download it from the `url` field.

## Step 3: Customize Your PDF

Add formatting options to control the appearance:

```bash
curl -X POST https://api.speedstein.com/api/generate \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><head><style>body { font-family: Arial; color: #333; } h1 { color: #0066cc; }</style></head><body><h1>Invoice #12345</h1><p>Amount Due: $100.00</p></body></html>",
    "options": {
      "format": "A4",
      "orientation": "portrait",
      "printBackground": true,
      "margin": {
        "top": "2cm",
        "right": "2cm",
        "bottom": "2cm",
        "left": "2cm"
      }
    }
  }'
```

### Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | string | `'A4'` | Page size: `'A4'`, `'A3'`, `'Letter'`, `'Legal'`, `'Tabloid'` |
| `orientation` | string | `'portrait'` | Page orientation: `'portrait'` or `'landscape'` |
| `printBackground` | boolean | `true` | Include CSS background colors and images |
| `margin.top` | string | `'1cm'` | Top margin (e.g., `'1cm'`, `'10mm'`, `'0.5in'`) |
| `margin.right` | string | `'1cm'` | Right margin |
| `margin.bottom` | string | `'1cm'` | Bottom margin |
| `margin.left` | string | `'1cm'` | Left margin |
| `scale` | number | `1.0` | Scale factor (0.1 to 2.0) |
| `displayHeaderFooter` | boolean | `false` | Show header and footer |
| `headerTemplate` | string | `''` | Custom header HTML |
| `footerTemplate` | string | `''` | Custom footer HTML |

## Code Examples

### JavaScript (Node.js)

```javascript
const fetch = require('node-fetch');

async function generatePDF() {
  const response = await fetch('https://api.speedstein.com/api/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_live_YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: '<html><body><h1>Hello from Node.js!</h1></body></html>',
      options: {
        format: 'A4',
        printBackground: true
      }
    })
  });

  const data = await response.json();
  console.log('PDF URL:', data.url);
  console.log('Generation time:', data.generationTime, 'ms');
  return data.url;
}

generatePDF();
```

### Python

```python
import requests
import json

def generate_pdf():
    url = 'https://api.speedstein.com/api/generate'
    headers = {
        'Authorization': 'Bearer sk_live_YOUR_API_KEY',
        'Content-Type': 'application/json'
    }
    payload = {
        'html': '<html><body><h1>Hello from Python!</h1></body></html>',
        'options': {
            'format': 'A4',
            'printBackground': True
        }
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    data = response.json()

    print(f"PDF URL: {data['url']}")
    print(f"Generation time: {data['generationTime']} ms")
    return data['url']

generate_pdf()
```

### PHP

```php
<?php
$apiKey = 'sk_live_YOUR_API_KEY';
$url = 'https://api.speedstein.com/api/generate';

$payload = json_encode([
    'html' => '<html><body><h1>Hello from PHP!</h1></body></html>',
    'options' => [
        'format' => 'A4',
        'printBackground' => true
    ]
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo "PDF URL: " . $data['url'] . "\n";
echo "Generation time: " . $data['generationTime'] . " ms\n";
?>
```

### Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

def generate_pdf
  uri = URI('https://api.speedstein.com/api/generate')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true

  request = Net::HTTP::Post.new(uri.path, {
    'Authorization' => 'Bearer sk_live_YOUR_API_KEY',
    'Content-Type' => 'application/json'
  })

  request.body = {
    html: '<html><body><h1>Hello from Ruby!</h1></body></html>',
    options: {
      format: 'A4',
      printBackground: true
    }
  }.to_json

  response = http.request(request)
  data = JSON.parse(response.body)

  puts "PDF URL: #{data['url']}"
  puts "Generation time: #{data['generationTime']} ms"
  data['url']
end

generate_pdf
```

## Step 4: Check Your Usage

View your current usage and remaining quota:

```bash
curl -X GET https://api.speedstein.com/api/usage \
  -H "Authorization: Bearer <your_supabase_jwt>"
```

**Note**: For usage stats, you need to be logged in and use your Supabase JWT token (not your API key). Get this from your dashboard session.

Response:
```json
{
  "success": true,
  "usage": {
    "quota": {
      "plan": "free",
      "limit": 100,
      "used": 3,
      "remaining": 97,
      "percentage": 3
    }
  }
}
```

## Common Issues

### 401 Unauthorized

**Problem**: Invalid or revoked API key

**Solution**:
- Double-check your API key is correct
- Ensure you're using the Bearer token format: `Authorization: Bearer sk_live_...`
- Verify the key hasn't been revoked in your dashboard

### 429 Too Many Requests

**Problem**: You've exceeded your plan quota

**Solution**:
- Check your usage in the [dashboard](https://speedstein.com/dashboard)
- [Upgrade your plan](https://speedstein.com/pricing) for more quota
- Wait until your quota resets at the start of the next billing period

### 413 Payload Too Large

**Problem**: Your HTML exceeds 10MB

**Solution**:
- Reduce the size of your HTML content
- Remove large embedded images (use external URLs instead)
- Minify your HTML/CSS

### 504 Gateway Timeout

**Problem**: PDF generation took longer than 10 seconds

**Solution**:
- Simplify your HTML (remove complex CSS or JavaScript)
- Reduce the number of external resources
- Avoid loading large fonts or images

## Next Steps

- **Try the Live Demo**: Visit [speedstein.com](https://speedstein.com) to experiment with HTML → PDF conversion
- **Read the API Reference**: Explore all available [endpoints and options](../../SPEEDSTEIN_API_REFERENCE.md)
- **Upgrade Your Plan**: Get more quota with [Starter ($29/mo for 5K PDFs) or Pro ($99/mo for 50K PDFs)](https://speedstein.com/pricing)
- **Advanced Usage**: Learn about [WebSocket API and promise pipelining](../../SPEEDSTEIN_TECHNICAL_SPEC.md) for high-volume batch operations

## Support

- **Documentation**: [docs.speedstein.com](https://docs.speedstein.com)
- **Email**: support@speedstein.com
- **Status Page**: [status.speedstein.com](https://status.speedstein.com)
- **Community**: [Discord server](https://discord.gg/speedstein)

---

**Happy PDF generating!** 🚀
