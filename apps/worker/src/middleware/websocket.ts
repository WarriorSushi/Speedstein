/**
 * WebSocket RPC Middleware
 *
 * Handles WebSocket upgrade for Cap'n Web RPC connections.
 * Implements heartbeat mechanism and graceful cleanup.
 */

import { newWorkersRpcResponse } from 'capnweb';
import { PdfGeneratorApi } from '../rpc/pdf-generator-api';
import type { Env } from '../types/env';

/**
 * WebSocket heartbeat configuration
 */
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds - close if no pong received

/**
 * Active WebSocket connections tracker
 */
interface WebSocketConnection {
  socket: WebSocket;
  sessionId: string;
  userId: string;
  lastHeartbeat: number;
  heartbeatInterval?: number;
}

// Global connections map (in-memory, per Worker instance)
const activeConnections = new Map<string, WebSocketConnection>();

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * WebSocket upgrade handler
 *
 * Upgrades HTTP request to WebSocket connection and initializes Cap'n Web RPC.
 *
 * @param request - HTTP upgrade request
 * @param env - Worker environment bindings
 * @returns Response with WebSocket upgrade or error
 */
export async function handleWebSocketUpgrade(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Extract user ID from query params or headers
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';

    // Validate WebSocket upgrade request
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    // Generate session ID
    const sessionId = generateSessionId();

    console.log(`[WebSocket] New connection request: sessionId=${sessionId}, userId=${userId}`);

    // Create WebSocket pair
    const { 0: client, 1: server } = new WebSocketPair();

    // Accept the WebSocket connection
    server.accept();

    // Create PdfGeneratorApi RPC target
    const pdfApi = new PdfGeneratorApi(userId, env.BROWSER_POOL_DO, sessionId);

    // Initialize Cap'n Web RPC response
    // This handles the RPC protocol over WebSocket
    const rpcResponse = newWorkersRpcResponse(server as any, pdfApi);

    // Track connection
    const connection: WebSocketConnection = {
      socket: server,
      sessionId,
      userId,
      lastHeartbeat: Date.now(),
    };
    activeConnections.set(sessionId, connection);

    // Set up heartbeat mechanism
    setupHeartbeat(connection);

    // Set up disconnect handler
    server.addEventListener('close', (event) => {
      handleDisconnect(sessionId, event.code, event.reason);
    });

    server.addEventListener('error', (event) => {
      console.error(`[WebSocket ${sessionId}] Error:`, event);
      handleDisconnect(sessionId, 1011, 'Internal error');
    });

    console.log(
      `[WebSocket] Connection established: sessionId=${sessionId}, userId=${userId}, active=${activeConnections.size}`
    );

    // Return WebSocket upgrade response
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  } catch (error) {
    console.error('[WebSocket] Upgrade error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Set up heartbeat mechanism for WebSocket connection
 *
 * Sends ping every 30 seconds and closes connection if no response within 60 seconds.
 *
 * @param connection - WebSocket connection object
 */
function setupHeartbeat(connection: WebSocketConnection): void {
  const { socket, sessionId } = connection;

  // Send ping every 30 seconds
  const interval = setInterval(() => {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - connection.lastHeartbeat;

    // Check if connection is still alive
    if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.warn(
        `[WebSocket ${sessionId}] Heartbeat timeout (${timeSinceLastHeartbeat}ms), closing connection`
      );
      clearInterval(interval);
      socket.close(1000, 'Heartbeat timeout');
      return;
    }

    // Send ping
    try {
      socket.send(JSON.stringify({ type: 'ping', timestamp: now }));
      console.log(`[WebSocket ${sessionId}] Heartbeat ping sent`);
    } catch (error) {
      console.error(`[WebSocket ${sessionId}] Heartbeat ping failed:`, error);
      clearInterval(interval);
      socket.close(1011, 'Heartbeat failed');
    }
  }, HEARTBEAT_INTERVAL);

  // Store interval ID for cleanup
  connection.heartbeatInterval = interval as unknown as number;

  // Listen for pong messages
  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data as string);
      if (message.type === 'pong') {
        connection.lastHeartbeat = Date.now();
        console.log(`[WebSocket ${sessionId}] Heartbeat pong received`);
      }
    } catch {
      // Not a JSON message, ignore
    }
  });
}

/**
 * Handle WebSocket disconnect with graceful cleanup
 *
 * @param sessionId - Session ID to clean up
 * @param code - WebSocket close code
 * @param reason - WebSocket close reason
 */
function handleDisconnect(sessionId: string, code: number, reason: string): void {
  const connection = activeConnections.get(sessionId);

  if (!connection) {
    console.warn(`[WebSocket] Disconnect for unknown session: ${sessionId}`);
    return;
  }

  console.log(
    `[WebSocket ${sessionId}] Disconnected: code=${code}, reason="${reason}", active=${activeConnections.size - 1}`
  );

  // Clear heartbeat interval
  if (connection.heartbeatInterval) {
    clearInterval(connection.heartbeatInterval);
  }

  // Remove from active connections
  activeConnections.delete(sessionId);

  // RPC cleanup is handled automatically by Symbol.dispose in PdfGeneratorApi
}

/**
 * Get active connections count
 * Useful for monitoring and metrics
 */
export function getActiveConnectionsCount(): number {
  return activeConnections.size;
}

/**
 * Get all active session IDs
 * Useful for debugging
 */
export function getActiveSessions(): string[] {
  return Array.from(activeConnections.keys());
}

/**
 * Force close a specific session
 * Useful for admin operations
 */
export function closeSession(sessionId: string, reason: string = 'Admin close'): boolean {
  const connection = activeConnections.get(sessionId);
  if (!connection) {
    return false;
  }

  connection.socket.close(1000, reason);
  return true;
}
