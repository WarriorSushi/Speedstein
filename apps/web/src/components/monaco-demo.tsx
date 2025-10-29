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
import { Loader2, Zap, Wifi, Check } from 'lucide-react'

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
      color: oklch(20% 0 0); /* Near black */
    }
    h1 {
      color: oklch(55% 0.25 260); /* Primary blue */
      margin-bottom: 1rem;
    }
    .highlight {
      background: oklch(95% 0.1 85); /* Warm yellow */
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
  onWarmup?: () => Promise<void>
  isGenerating?: boolean
  isWarmingUp?: boolean
  isWarmedUp?: boolean
  lastRestTime?: number | null
  lastRpcTime?: number | null
  rpcConnectionState?: 'disconnected' | 'connecting' | 'connected' | 'error'
}

export function MonacoDemo({
  onGenerateRest,
  onGenerateRpc,
  onWarmup,
  isGenerating = false,
  isWarmingUp = false,
  isWarmedUp = false,
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

        {/* Warmup Button - Show only if not warmed up */}
        {onWarmup && !isWarmedUp && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Button
              onClick={onWarmup}
              disabled={isWarmingUp}
              size="lg"
              className="h-20 px-12 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
              variant="default"
            >
              {isWarmingUp ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  <div className="flex flex-col items-start">
                    <span>Warming up...</span>
                    <span className="text-xs font-normal opacity-80">Initializing engine</span>
                  </div>
                </>
              ) : (
                <>
                  <Zap className="mr-3 h-6 w-6" />
                  <div className="flex flex-col items-start">
                    <span>I want to feel the speed</span>
                    <span className="text-xs font-normal opacity-80">(free live demo)</span>
                  </div>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Warmed Up Success Message */}
        {isWarmedUp && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4 text-center">
            <span className="text-sm font-semibold text-green-600">✓ Ready! Compare the technologies below</span>
          </div>
        )}

        {/* Dual Demo Buttons - Show after warmup */}
        {isWarmedUp && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speedstein's Secret Tech (LEFT) */}
            {onGenerateRpc && (
              <div className="space-y-2">
                <Button
                  onClick={handleGenerateRpc}
                  disabled={isGenerating || !html.trim()}
                  className="w-full relative"
                  size="lg"
                  variant="default"
                >
                  {isGenerating && activeMode === 'rpc' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wifi className="mr-2 h-4 w-4" />
                      ⚡ Speedstein Tech
                    </>
                  )}
                </Button>
                {lastRpcTime !== null && lastRpcTime !== undefined && (
                  <div className="text-center text-sm font-bold text-green-600">
                    {lastRpcTime}ms ✓
                  </div>
                )}
              </div>
            )}

            {/* Standard REST API (RIGHT) */}
            <div className="space-y-2">
              <Button
                onClick={handleGenerateRest}
                disabled={isGenerating || !html.trim()}
                className="w-full"
                size="lg"
                variant="outline"
              >
                {isGenerating && activeMode === 'rest' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Standard REST API
                  </>
                )}
              </Button>
              {lastRestTime !== null && lastRestTime !== undefined && (
                <div className="text-center text-sm font-semibold text-muted-foreground">
                  {lastRestTime}ms
                </div>
              )}
            </div>
          </div>
        )}

        {/* Best Part Message - Show after first PDF */}
        {lastRpcTime !== null && isWarmedUp && (
          <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary text-center">
            <p className="text-base font-bold text-primary">
              🚀 Click <span className="underline">Speedstein Tech</span> again - it gets FASTER with every use!
            </p>
          </div>
        )}

        {/* Simplified Performance Stats */}
        {lastRestTime !== null && lastRpcTime !== null && lastRestTime !== undefined && lastRpcTime !== undefined && lastRestTime > lastRpcTime && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-700 text-center">
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              {Math.round(((lastRestTime - lastRpcTime) / lastRestTime) * 100)}% faster · {(lastRestTime - lastRpcTime).toFixed(0)}ms saved per PDF
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              At 1,000 PDFs: saves {((lastRestTime - lastRpcTime) * 1000 / 60000).toFixed(1)} minutes
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
