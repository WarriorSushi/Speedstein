/**
 * Authentication Documentation
 * How to authenticate API requests with API keys
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle2, Key } from 'lucide-react';

export default function AuthenticationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Authentication</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Securely authenticate your API requests using API keys
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Overview
        </h2>
        <p className="text-muted-foreground">
          Speedstein uses API keys to authenticate requests. Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
        </p>

        <Card className="border-blue-500/50 bg-blue-500/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Secure by Design</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              All API keys are SHA-256 hashed before storage. We never store plaintext keys in our database.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Key Format */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          API Key Format
        </h2>
        <p className="text-muted-foreground">
          API keys follow a structured format that includes your subscription tier:
        </p>

        <div className="rounded-lg border bg-muted/50 p-4">
          <code className="text-sm font-mono">sk_[tier]_[32-character-secret]</code>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                Free Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs font-mono break-all">
                sk_free_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                Starter Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs font-mono break-all">
                sk_starter_X9y8Z7w6V5u4T3s2R1q0P9o8N7m6L5k4
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                Pro Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs font-mono break-all">
                sk_pro_M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                Enterprise Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs font-mono break-all">
                sk_enterprise_H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3
              </code>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Using Your API Key */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Using Your API Key
        </h2>
        <p className="text-muted-foreground">
          Pass your API key in the <code>Authorization</code> header using the <code>Bearer</code> scheme:
        </p>

        <div className="rounded-lg border bg-muted/50 overflow-hidden">
          <div className="border-b bg-muted px-4 py-2">
            <span className="text-sm font-mono text-muted-foreground">HTTP Header</span>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono">{`Authorization: Bearer sk_free_YOUR_API_KEY_HERE`}</code>
          </pre>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Example Requests</h3>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>cURL</Badge>
            </div>
            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{`curl https://api.speedstein.com/v1/pdf/generate \\
  -H "Authorization: Bearer sk_free_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"html":"<h1>Test</h1>"}'`}</code>
              </pre>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>JavaScript</Badge>
            </div>
            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{`const response = await fetch('https://api.speedstein.com/v1/pdf/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_free_YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ html: '<h1>Test</h1>' })
});`}</code>
              </pre>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>Python</Badge>
            </div>
            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{`import requests

response = requests.post(
    'https://api.speedstein.com/v1/pdf/generate',
    headers={
        'Authorization': 'Bearer sk_free_YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={'html': '<h1>Test</h1>'}
)`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Security Best Practices
        </h2>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Keep Your API Keys Secret</AlertTitle>
          <AlertDescription>
            Never commit API keys to version control or expose them in client-side code. Use environment variables instead.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">✓ Good Practice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg border bg-muted/50 p-4">
                <code className="text-sm font-mono">{`// .env file (never commit this!)
SPEEDSTEIN_API_KEY=sk_free_YOUR_API_KEY

// app.js
const apiKey = process.env.SPEEDSTEIN_API_KEY;`}</code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">✗ Bad Practice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg border bg-muted/50 p-4">
                <code className="text-sm font-mono">{`// app.js (NEVER DO THIS!)
const apiKey = 'sk_free_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6';

// frontend.js (NEVER DO THIS!)
fetch('https://api.speedstein.com/v1/pdf/generate', {
  headers: { 'Authorization': 'Bearer sk_free_...' }
});`}</code>
              </div>
            </CardContent>
          </Card>
        </div>

        <ul className="space-y-2 list-disc list-inside text-muted-foreground">
          <li>Store API keys in environment variables or secure key management systems</li>
          <li>Never expose API keys in client-side JavaScript or mobile apps</li>
          <li>Use different API keys for development, staging, and production</li>
          <li>Rotate API keys regularly (every 90 days recommended)</li>
          <li>Revoke compromised keys immediately in your dashboard</li>
          <li>Limit API key permissions to only what&apos;s necessary</li>
        </ul>
      </div>

      {/* Key Management */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Key Management
        </h2>
        <p className="text-muted-foreground">
          You can create, view, and revoke API keys in your dashboard:
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Create New Keys</p>
                <p className="text-sm text-muted-foreground">Generate up to 10 active keys per account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">View Key Metadata</p>
                <p className="text-sm text-muted-foreground">See creation date, last used timestamp, and key prefix</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Revoke Keys</p>
                <p className="text-sm text-muted-foreground">Instantly invalidate compromised or unused keys</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Track Usage</p>
                <p className="text-sm text-muted-foreground">Monitor when each key was last used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button asChild>
          <Link href="/dashboard/api-keys">Manage API Keys</Link>
        </Button>
      </div>

      {/* Authentication Errors */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          Common Authentication Errors
        </h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Badge variant="destructive" className="w-fit">401 Unauthorized</Badge>
              <CardTitle className="text-lg mt-2">Missing or Invalid API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-4 mb-2">
                <code className="text-sm font-mono">{`{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or missing API key"
  }
}`}</code>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Solution:</strong> Verify your API key is correct and included in the Authorization header.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="destructive" className="w-fit">403 Forbidden</Badge>
              <CardTitle className="text-lg mt-2">Revoked API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-4 mb-2">
                <code className="text-sm font-mono">{`{
  "error": {
    "code": "forbidden",
    "message": "API key has been revoked"
  }
}`}</code>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Solution:</strong> Create a new API key in your dashboard.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="destructive" className="w-fit">429 Too Many Requests</Badge>
              <CardTitle className="text-lg mt-2">Rate Limit Exceeded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-4 mb-2">
                <code className="text-sm font-mono">{`{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Please retry after 60 seconds."
  }
}`}</code>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Solution:</strong> Wait for the rate limit window to reset or upgrade your plan for higher limits.
              </p>
            </CardContent>
          </Card>
        </div>

        <Button variant="outline" asChild>
          <Link href="/docs/resources/errors">View All Error Codes</Link>
        </Button>
      </div>
    </div>
  );
}
