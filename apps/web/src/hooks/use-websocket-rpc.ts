'use client'

/**
 * WebSocket RPC Hook for PDF Generation
 *
 * Simple Cap'n Web RPC client for browser usage.
 * Connects to worker's /api/rpc WebSocket endpoint.
 *
 * Constitution Compliance:
 * - Principle VI: Cap'n Web RPC with promise pipelining
 * - Principle I: Targeting <2s PDF generation via WebSocket
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface RpcPdfResult {
  success: boolean
  url?: string
  size?: number
  generationTime?: number
  error?: string
  pdfBuffer?: number[]
}

export type RpcConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export function useWebSocketRpc(workerUrl: string) {
  const [connectionState, setConnectionState] = useState<RpcConnectionState>('disconnected')
  const [lastError, setLastError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingRequestsRef = useRef<Map<string, (result: RpcPdfResult) => void>>(new Map())

  // Connect to WebSocket RPC endpoint
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      setConnectionState('connecting')
      setLastError(null)

      // Convert HTTP URL to WebSocket URL
      const wsUrl = workerUrl.replace(/^http/, 'ws') + '/api/rpc?userId=demo-user'

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[RPC] WebSocket connected')
        setConnectionState('connected')
        resolve()
      }

      ws.onerror = (event) => {
        console.error('[RPC] WebSocket error:', event)
        setConnectionState('error')
        setLastError('WebSocket connection error')
        reject(new Error('WebSocket connection error'))
      }

      ws.onclose = (event) => {
        console.log(`[RPC] WebSocket closed: code=${event.code}, reason=${event.reason}`)
        setConnectionState('disconnected')
        wsRef.current = null

        // Reject all pending requests
        pendingRequestsRef.current.forEach((reject) => {
          reject({
            success: false,
            error: 'WebSocket connection closed',
          })
        })
        pendingRequestsRef.current.clear()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          // Handle heartbeat ping
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
            return
          }

          // Handle RPC response (simplified - Cap'n Web would handle this properly)
          if (message.requestId && pendingRequestsRef.current.has(message.requestId)) {
            const resolve = pendingRequestsRef.current.get(message.requestId)!
            pendingRequestsRef.current.delete(message.requestId)
            resolve(message.result)
          }
        } catch (error) {
          console.error('[RPC] Message parse error:', error)
        }
      }
    })
  }, [workerUrl])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }
    setConnectionState('disconnected')
  }, [])

  // Generate PDF via RPC (simplified - in production, use proper Cap'n Web client)
  const generatePdf = useCallback(async (html: string): Promise<RpcPdfResult> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connect()
    }

    return new Promise((resolve) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Store resolver
      pendingRequestsRef.current.set(requestId, resolve)

      // Send RPC request (simplified format)
      wsRef.current!.send(JSON.stringify({
        requestId,
        method: 'generatePdf',
        params: {
          html,
          options: {}
        }
      }))

      // Timeout after 30s
      setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId)
          resolve({
            success: false,
            error: 'Request timeout',
          })
        }
      }, 30000)
    })
  }, [connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connectionState,
    lastError,
    connect,
    disconnect,
    generatePdf,
  }
}
