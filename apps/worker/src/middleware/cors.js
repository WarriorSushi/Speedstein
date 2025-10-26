/**
 * CORS Middleware
 *
 * Handles Cross-Origin Resource Sharing (CORS) for API requests.
 * Implements proper preflight handling and security headers.
 *
 * @packageDocumentation
 */
/**
 * Default CORS configuration
 */
const DEFAULT_CORS_CONFIG = {
    allowedOrigins: ['https://speedstein.com', 'https://www.speedstein.com'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-RateLimit-Used',
    ],
    allowCredentials: true,
    maxAge: 86400, // 24 hours
};
/**
 * CORS handler
 */
export class CorsHandler {
    config;
    constructor(config) {
        this.config = {
            ...DEFAULT_CORS_CONFIG,
            ...config,
        };
    }
    /**
     * Check if an origin is allowed
     *
     * @param origin - The request origin
     * @returns true if origin is allowed
     */
    isOriginAllowed(origin) {
        if (!origin) {
            return false;
        }
        // Allow all origins (*)
        if (this.config.allowedOrigins === '*') {
            return true;
        }
        // Check if origin is in allowed list
        if (Array.isArray(this.config.allowedOrigins)) {
            return this.config.allowedOrigins.includes(origin);
        }
        // Single origin string
        return this.config.allowedOrigins === origin;
    }
    /**
     * Get CORS headers for a response
     *
     * @param origin - The request origin
     * @returns CORS headers object
     */
    getCorsHeaders(origin) {
        const headers = {};
        // Set Access-Control-Allow-Origin
        if (this.isOriginAllowed(origin)) {
            headers['Access-Control-Allow-Origin'] = origin || '*';
        }
        else if (this.config.allowedOrigins === '*') {
            headers['Access-Control-Allow-Origin'] = '*';
        }
        // Set Access-Control-Allow-Credentials
        if (this.config.allowCredentials && origin) {
            headers['Access-Control-Allow-Credentials'] = 'true';
        }
        // Set Access-Control-Expose-Headers
        if (this.config.exposedHeaders.length > 0) {
            headers['Access-Control-Expose-Headers'] = this.config.exposedHeaders.join(', ');
        }
        return headers;
    }
    /**
     * Get preflight headers for OPTIONS requests
     *
     * @param origin - The request origin
     * @returns Preflight CORS headers
     */
    getPreflightHeaders(origin) {
        const headers = this.getCorsHeaders(origin);
        // Add preflight-specific headers
        headers['Access-Control-Allow-Methods'] = this.config.allowedMethods.join(', ');
        headers['Access-Control-Allow-Headers'] = this.config.allowedHeaders.join(', ');
        headers['Access-Control-Max-Age'] = this.config.maxAge.toString();
        return headers;
    }
    /**
     * Handle CORS preflight (OPTIONS) request
     *
     * @param request - The incoming request
     * @returns Preflight response
     *
     * @example
     * ```typescript
     * const corsHandler = new CorsHandler();
     *
     * if (request.method === 'OPTIONS') {
     *   return corsHandler.handlePreflight(request);
     * }
     * ```
     */
    handlePreflight(request) {
        const origin = request.headers.get('Origin');
        const headers = this.getPreflightHeaders(origin);
        return new Response(null, {
            status: 204, // No Content
            headers,
        });
    }
    /**
     * Add CORS headers to a response
     *
     * @param response - The original response
     * @param origin - The request origin
     * @returns Response with CORS headers added
     *
     * @example
     * ```typescript
     * const corsHandler = new CorsHandler();
     * const response = new Response('OK');
     * return corsHandler.addCorsHeaders(response, request.headers.get('Origin'));
     * ```
     */
    addCorsHeaders(response, origin) {
        const corsHeaders = this.getCorsHeaders(origin);
        // Create new response with CORS headers
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            newResponse.headers.set(key, value);
        });
        return newResponse;
    }
    /**
     * Middleware function to handle CORS
     *
     * @param request - The incoming request
     * @param next - Next handler function
     * @returns Response with CORS headers
     *
     * @example
     * ```typescript
     * const corsHandler = new CorsHandler();
     *
     * export default {
     *   async fetch(request: Request, env: Env): Promise<Response> {
     *     return corsHandler.middleware(request, async () => {
     *       // Your request handler logic
     *       return new Response('OK');
     *     });
     *   },
     * };
     * ```
     */
    async middleware(request, next) {
        const origin = request.headers.get('Origin');
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return this.handlePreflight(request);
        }
        // Process request and add CORS headers to response
        const response = await next();
        return this.addCorsHeaders(response, origin);
    }
}
/**
 * Create default CORS handler for Speedstein API
 *
 * Allows requests from speedstein.com domains and localhost (dev).
 */
export function createDefaultCorsHandler() {
    const allowedOrigins = process.env.NODE_ENV === 'development'
        ? ['https://speedstein.com', 'https://www.speedstein.com', 'http://localhost:3000']
        : ['https://speedstein.com', 'https://www.speedstein.com'];
    return new CorsHandler({
        allowedOrigins,
    });
}
