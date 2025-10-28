/**
 * R2 Storage Service
 *
 * Handles PDF uploads to Cloudflare R2 object storage with lifecycle policies.
 * Provides public URL generation and automatic cleanup based on subscription tier.
 *
 * @packageDocumentation
 */
import { TIER_QUOTAS } from '@speedstein/shared/types/user';
/**
 * R2 Storage Service
 *
 * Manages PDF uploads to R2 with tier-based retention policies.
 */
export class R2Service {
    bucket;
    publicDomain;
    constructor(bucket, publicDomain) {
        this.bucket = bucket;
        this.publicDomain = publicDomain;
    }
    /**
     * Upload PDF to R2 storage
     *
     * @param pdfBuffer - PDF file as ArrayBuffer
     * @param userId - User ID for namespace organization
     * @param requestId - Unique request identifier
     * @param tier - User's subscription tier (determines retention)
     * @param metadata - Optional custom metadata
     * @returns Upload result with public URL
     */
    async uploadPdf(pdfBuffer, userId, requestId, tier, metadata) {
        const now = new Date();
        const retentionDays = TIER_QUOTAS[tier].retentionDays;
        // Generate R2 object key: {userId}/{year}/{month}/{requestId}.pdf
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const key = `${userId}/${year}/${month}/${requestId}.pdf`;
        // Calculate expiration date
        const expiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        // Prepare R2 metadata
        const r2Metadata = {
            userId,
            requestId,
            tier,
            uploadedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            ...metadata,
        };
        // Upload to R2
        await this.bucket.put(key, pdfBuffer, {
            httpMetadata: {
                contentType: 'application/pdf',
                cacheControl: `public, max-age=${retentionDays * 86400}`,
            },
            customMetadata: r2Metadata,
        });
        // Generate public URL
        const url = `${this.publicDomain}/${key}`;
        return {
            url,
            key,
            uploadedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            size: pdfBuffer.byteLength,
            contentType: 'application/pdf',
        };
    }
    /**
     * Get PDF from R2 storage
     *
     * @param key - R2 object key
     * @returns PDF buffer or null if not found
     */
    async getPdf(key) {
        const object = await this.bucket.get(key);
        if (!object) {
            return null;
        }
        return object.arrayBuffer();
    }
    /**
     * Delete PDF from R2 storage
     *
     * @param key - R2 object key
     */
    async deletePdf(key) {
        await this.bucket.delete(key);
    }
    /**
     * Get PDF metadata without downloading the file
     *
     * @param key - R2 object key
     * @returns Metadata or null if not found
     */
    async getPdfMetadata(key) {
        const object = await this.bucket.head(key);
        if (!object) {
            return null;
        }
        return object.customMetadata || null;
    }
    /**
     * List PDFs for a user
     *
     * @param userId - User ID
     * @param limit - Maximum number of results (default: 100)
     * @returns Array of R2 object keys
     */
    async listUserPdfs(userId, limit = 100) {
        const prefix = `${userId}/`;
        const listed = await this.bucket.list({
            prefix,
            limit,
        });
        return listed.objects.map((obj) => obj.key);
    }
    /**
     * Delete all PDFs for a user (cleanup on account deletion)
     *
     * @param userId - User ID
     */
    async deleteAllUserPdfs(userId) {
        const keys = await this.listUserPdfs(userId, 1000);
        // Delete in batches (R2 delete is limited to 1000 keys per request)
        await Promise.all(keys.map((key) => this.bucket.delete(key)));
        return keys.length;
    }
    /**
     * Clean up expired PDFs (should be run on a schedule)
     *
     * Checks metadata for expiresAt and deletes expired files.
     * This is a backup to R2 lifecycle policies.
     *
     * @param batchSize - Number of objects to check per batch
     */
    async cleanupExpiredPdfs(batchSize = 100) {
        let deletedCount = 0;
        let cursor;
        do {
            const listed = await this.bucket.list({
                limit: batchSize,
                cursor,
            });
            const now = new Date();
            for (const obj of listed.objects) {
                const metadata = await this.getPdfMetadata(obj.key);
                if (metadata?.expiresAt) {
                    const expiresAt = new Date(metadata.expiresAt);
                    if (expiresAt < now) {
                        await this.deletePdf(obj.key);
                        deletedCount++;
                    }
                }
            }
            cursor = listed.truncated ? listed.cursor : undefined;
        } while (cursor);
        return deletedCount;
    }
    /**
     * Generate signed URL for temporary access (if needed for private buckets)
     * Note: R2 doesn't natively support signed URLs yet, so this is a placeholder
     *
     * @param key - R2 object key
     * @param expiresIn - Expiration time in seconds
     * @returns Public URL (currently not signed)
     */
    generateSignedUrl(key, expiresIn) {
        // TODO: Implement proper signed URLs when R2 supports them
        // For now, return public URL if bucket is public
        return `${this.publicDomain}/${key}`;
    }
}
/**
 * Helper function to extract R2 key from public URL
 */
export function extractR2KeyFromUrl(url, publicDomain) {
    if (!url.startsWith(publicDomain)) {
        return null;
    }
    return url.substring(publicDomain.length + 1);
}
