/**
 * Cap'n Web RPC Type Definitions
 *
 * TypeScript types for the PDF Generator RPC API using Cap'n Web protocol.
 * Supports both WebSocket and HTTP Batch transports with promise pipelining.
 */
// ============================================================================
// TYPE GUARDS
// ============================================================================
/**
 * Type guard for RPC error response
 */
export function isRpcError(response) {
    return response.success === false;
}
/**
 * Type guard for single PDF response
 */
export function isRpcPdfResponse(response) {
    return response.success === true;
}
/**
 * Type guard for batch PDF response
 */
export function isRpcBatchResponse(response) {
    return response.success === true && 'results' in response.data;
}
