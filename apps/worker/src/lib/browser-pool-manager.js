/**
 * Browser Pool Manager
 *
 * Utility for managing Durable Object stubs for BrowserPoolDO instances.
 * Routes requests to specific DO instances based on user ID hash for consistent routing.
 */
/**
 * Get consistent hash for user ID to route to specific DO instance
 * Uses simple hash function to distribute users across DO instances
 */
export function getUserHash(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
/**
 * Get Durable Object ID for a user
 * Routes users to one of multiple DO instances for load distribution
 *
 * @param userId - User ID to route
 * @param namespace - DurableObjectNamespace binding
 * @param poolSize - Number of DO instances to distribute across (default: 10)
 */
export function getDOIdForUser(userId, namespace, poolSize = 10) {
    const hash = getUserHash(userId);
    const doIndex = hash % poolSize;
    const doName = `browser-pool-${doIndex}`;
    // Get Durable Object ID by name for consistent routing
    return namespace.idFromName(doName);
}
/**
 * Get Durable Object stub for a user
 * Creates consistent routing to the same DO instance for the same user
 *
 * @param userId - User ID to route
 * @param namespace - DurableObjectNamespace binding
 * @param poolSize - Number of DO instances to distribute across
 */
export function getDOStubForUser(userId, namespace, poolSize = 10) {
    const id = getDOIdForUser(userId, namespace, poolSize);
    return namespace.get(id);
}
/**
 * Generate PDF using Durable Object browser pool
 * Routes request to appropriate DO instance and handles response
 *
 * @param userId - User ID for routing
 * @param html - HTML content to convert to PDF
 * @param options - PDF generation options
 * @param namespace - DurableObjectNamespace binding
 */
export async function generatePdfWithDO(userId, html, options, namespace) {
    const stub = getDOStubForUser(userId, namespace);
    // Create request to Durable Object
    const request = new Request('https://fake-host/generate?action=generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, options }),
    });
    try {
        const response = await stub.fetch(request);
        const result = (await response.json());
        if (!response.ok) {
            return {
                success: false,
                error: result.error || `HTTP ${response.status}`,
            };
        }
        return {
            success: true,
            pdfBuffer: result.pdfBuffer ? new Uint8Array(result.pdfBuffer) : undefined,
            generationTime: result.generationTime,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Get health status from a specific DO instance
 *
 * @param doIndex - Index of DO instance to check (0-9 by default)
 * @param namespace - DurableObjectNamespace binding
 */
export async function getDOHealth(doIndex, namespace) {
    const doName = `browser-pool-${doIndex}`;
    const id = namespace.idFromName(doName);
    const stub = namespace.get(id);
    const request = new Request('https://fake-host/health?action=health', {
        method: 'GET',
    });
    const response = await stub.fetch(request);
    return (await response.json());
}
/**
 * Get stats from a specific DO instance
 *
 * @param doIndex - Index of DO instance to check
 * @param namespace - DurableObjectNamespace binding
 */
export async function getDOStats(doIndex, namespace) {
    const doName = `browser-pool-${doIndex}`;
    const id = namespace.idFromName(doName);
    const stub = namespace.get(id);
    const request = new Request('https://fake-host/stats?action=stats', {
        method: 'GET',
    });
    const response = await stub.fetch(request);
    return (await response.json());
}
/**
 * Get aggregated stats from all DO instances
 *
 * @param namespace - DurableObjectNamespace binding
 * @param poolSize - Number of DO instances
 */
export async function getAllDOStats(namespace, poolSize = 10) {
    const statsPromises = [];
    for (let i = 0; i < poolSize; i++) {
        statsPromises.push(getDOStats(i, namespace));
    }
    const allStats = await Promise.all(statsPromises);
    return {
        totalPdfsGenerated: allStats.reduce((sum, stats) => sum + stats.totalPdfsGenerated, 0),
        totalBrowserInstances: allStats.reduce((sum, stats) => sum + stats.browserInstances.length, 0),
        totalLoad: allStats.reduce((sum, stats) => sum + stats.currentLoad, 0),
        instances: allStats,
    };
}
