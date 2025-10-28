'use client'

/**
 * Monaco Editor Demo Component
 *
 * Live HTML editor with dual demo modes: REST API and WebSocket RPC.
 * Shows performance comparison between traditional REST and Cap'n Web RPC.
 *
 * Constitution Compliance:
 * - Principle I (Performance): Demonstrates <2s generation target
 * - Principle VI (Cap'n Web): Shows WebSocket RPC promise pipelining
 * - Principle VII (UX): Live demo works without authentication
 * - Principle III (Design System): Uses OKLCH colors for editor theme
 *
 * @packageDocumentation
 */

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, Wifi } from 'lucide-react'

// Dynamic import Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import('@monaco-editor/react'), {
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-muted">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
  ssr: false, // Monaco Editor requires browser APIs
})

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 2rem;
      color: #333;
    }
    h1 {
      color: #2563eb;
      margin-bottom: 1rem;
    }
    .highlight {
      background: #fef3c7;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }
  </style>
</head>
<body>
  <h1>Welcome to Speedstein</h1>
  <p>
    Generate <span class="highlight">beautiful PDFs</span>
    from HTML in under 2 seconds.
  </p>
  <ul>
    <li>Fast: P95 latency < 2 seconds</li>
    <li>Reliable: 99.9% uptime SLA</li>
    <li>Simple: RESTful API with no setup</li>
  </ul>
</body>
</html>`

type DemoMode = 'rest' | 'rpc'

interface MonacoDemoProps {
  onGenerateRest?: (html: string) => void
  onGenerateRpc?: (html: string) => void
  isGenerating?: boolean
  lastRestTime?: number | null
  lastRpcTime?: number | null
  rpcConnectionState?: 'disconnected' | 'connecting' | 'connected' | 'error'
}

export function MonacoDemo({
  onGenerateRest,
  onGenerateRpc,
  isGenerating = false,
  lastRestTime,
  lastRpcTime,
  rpcConnectionState = 'disconnected'
}: MonacoDemoProps) {
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [activeMode, setActiveMode] = useState<DemoMode | null>(null)

  const handleGenerateRest = useCallback(() => {
    if (onGenerateRest && !isGenerating) {
      setActiveMode('rest')
      onGenerateRest(html)
    }
  }, [html, onGenerateRest, isGenerating])

  const handleGenerateRpc = useCallback(() => {
    if (onGenerateRpc && !isGenerating) {
      setActiveMode('rpc')
      onGenerateRpc(html)
    }
  }, [html, onGenerateRpc, isGenerating])

  const handleEditorChange = useCallback((value: string | undefined) => {
    setHtml(value || '')
  }, [])

  // Determine which time to show based on active mode
  const currentTime = activeMode === 'rest' ? lastRestTime : activeMode === 'rpc' ? lastRpcTime : null

  // Get connection state badge
  const getConnectionBadge = () => {
    switch (rpcConnectionState) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600"><Wifi className="mr-1 h-3 w-3" />Connected</Badge>
      case 'connecting':
        return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Connecting</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Disconnected</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Try It Live</CardTitle>
            <CardDescription>
              Edit the HTML below and compare REST vs WebSocket RPC performance. No signup required.
            </CardDescription>
          </div>
          {onGenerateRpc && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">RPC Status:</span>
              {getConnectionBadge()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border">
          <Editor
            height="400px"
            defaultLanguage="html"
            value={html}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
            }}
          />
        </div>

        {/* Dual Demo Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* REST API Demo */}
          <div className="space-y-2">
            <Button
              onClick={handleGenerateRest}
              disabled={isGenerating || !html.trim()}
              className="w-full"
              size="lg"
              variant={activeMode === 'rest' ? 'default' : 'outline'}
            >
              {isGenerating && activeMode === 'rest' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating (REST)...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  REST API
                </>
              )}
            </Button>
            {lastRestTime !== null && lastRestTime !== undefined && (
              <div className="text-center text-xs text-muted-foreground">
                <span className="font-semibold">{lastRestTime}ms</span>
                {lastRestTime < 2000 && (
                  <span className="ml-1 text-green-600">✓ Fast</span>
                )}
              </div>
            )}
          </div>

          {/* WebSocket RPC Demo */}
          {onGenerateRpc && (
            <div className="space-y-2">
              <Button
                onClick={handleGenerateRpc}
                disabled={isGenerating || !html.trim() || rpcConnectionState === 'error'}
                className="w-full"
                size="lg"
                variant={activeMode === 'rpc' ? 'default' : 'outline'}
              >
                {isGenerating && activeMode === 'rpc' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating (RPC)...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    WebSocket RPC
                  </>
                )}
              </Button>
              {lastRpcTime !== null && lastRpcTime !== undefined && (
                <div className="text-center text-xs text-muted-foreground">
                  <span className="font-semibold">{lastRpcTime}ms</span>
                  {lastRpcTime < 2000 && (
                    <span className="ml-1 text-green-600">✓ Constitution Compliant</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Performance Comparison */}
        {lastRestTime !== null && lastRpcTime !== null && lastRestTime !== undefined && lastRpcTime !== undefined && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <div className="text-sm font-semibold mb-2">Performance Comparison</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">REST API</div>
                <div className="text-2xl font-bold">{lastRestTime}ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">WebSocket RPC</div>
                <div className="text-2xl font-bold text-green-600">{lastRpcTime}ms</div>
              </div>
            </div>
            {lastRestTime > lastRpcTime && (
              <div className="mt-2 text-xs text-green-600">
                ⚡ RPC is {Math.round(((lastRestTime - lastRpcTime) / lastRestTime) * 100)}% faster
                ({(lastRestTime - lastRpcTime).toFixed(0)}ms improvement)
              </div>
            )}
          </div>
        )}

        {/* Current Generation Time */}
        {currentTime !== null && currentTime !== undefined && (
          <div className="text-center text-sm text-muted-foreground">
            ⚡ Last generated in <span className="font-semibold text-primary">{currentTime}ms</span>
            {currentTime < 2000 && (
              <span className="ml-2 text-green-600">• Constitution compliant (&lt;2s)</span>
            )}
            {currentTime >= 2000 && currentTime < 5000 && (
              <span className="ml-2 text-yellow-600">• Good performance</span>
            )}
            {currentTime >= 5000 && (
              <span className="ml-2 text-orange-600">• Optimization recommended</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
