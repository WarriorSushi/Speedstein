/**
 * Cloudflare R2 storage utilities
 *
 * Handles PDF file uploads to Cloudflare R2 with 30-day TTL.
 * R2 is used for storing generated PDFs with public access URLs.
 *
 * @packageDocumentation
 */

import { StorageError } from '@speedstein/shared/lib/errors';
import { PDF_EXPIRATION_DAYS } from '@speedstein/shared/types/pdf';

/**
 * Get retention period in days for a given pricing tier
 *
 * @param tier - User's pricing tier (free, starter, pro, enterprise)
 * @returns Retention period in days
 */
function getRetentionDaysForTier(tier: string): number {
  const retentionMap: Record<string, number> = {
    free: 1,
    starter: 7,
    pro: 30,
    enterprise: 90,
  };

  return retentionMap[tier.toLowerCase()] || 1; // Default to 1 day if tier not found
}

/**
 * R2 upload options
 */
export interface R2UploadOptions {
  /** The R2 bucket binding from Cloudflare Worker environment */
  bucket: R2Bucket;

  /** The PDF file content as ArrayBuffer or Uint8Array */
  content: ArrayBuffer | Uint8Array;

  /** The file name/key for the PDF (e.g., 'abc123.pdf') */
  fileName: string;

  /** Content-Type header (default: 'application/pdf') */
  contentType?: string;

  /** Custom metadata to attach to the object */
  metadata?: Record<string, string>;

  /** User's pricing tier for lifecycle tagging (free, starter, pro, enterprise) */
  userTier?: string;
}

/**
 * R2 upload result
 */
export interface R2UploadResult {
  /** The public URL to access the PDF */
  url: string;

  /** The R2 object key (file path) */
  key: string;

  /** File size in bytes */
  size: number;

  /** ISO 8601 timestamp when the file will expire */
  expiresAt: string;

  /** ETag of the uploaded object */
  etag: string;
}

/**
 * Upload a PDF file to Cloudflare R2
 *
 * Uploads the generated PDF to R2 storage with tier-based retention period.
 * The file will be publicly accessible via a CDN URL.
 * Lifecycle policies in R2 will automatically delete PDFs after their retention period.
 *
 * @param options - Upload configuration options
 * @returns Upload result with public URL and metadata
 * @throws StorageError if upload fails
 *
 * @example
 * ```typescript
 * const result = await uploadPdfToR2({
 *   bucket: env.R2_BUCKET,
 *   content: pdfBuffer,
 *   fileName: 'invoice-123.pdf',
 *   userTier: 'pro', // Will use 30-day retention
 *   metadata: {
 *     userId: 'user_123',
 *     requestId: 'req_abc',
 *   },
 * });
 *
 * console.log(result.url); // https://cdn.speedstein.com/pdfs/invoice-123.pdf
 * ```
 */
export async function uploadPdfToR2(options: R2UploadOptions): Promise<R2UploadResult> {
  const { bucket, content, fileName, contentType = 'application/pdf', metadata = {}, userTier } = options;

  try {
    // Calculate expiration date based on user tier
    // Retention periods: free=1d, starter=7d, pro=30d, enterprise=90d
    const retentionDays = getRetentionDaysForTier(userTier || 'free');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    // Prepare R2 put options with tier tagging for lifecycle policies
    const putOptions: R2PutOptions = {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year (immutable)
      },
      customMetadata: {
        ...metadata,
        tier: userTier || 'free', // Add tier tag for lifecycle policy filtering
        expiresAt: expiresAt.toISOString(),
        uploadedAt: new Date().toISOString(),
      },
    };

    // Upload to R2
    const object = await bucket.put(fileName, content, putOptions);

    if (!object) {
      throw new StorageError('Failed to upload PDF to R2: No object returned');
    }

    // Construct public URL
    // Format: https://cdn.speedstein.com/pdfs/{fileName}
    // Note: You'll need to configure a custom domain in Cloudflare R2 settings
    const publicUrl = `https://cdn.speedstein.com/pdfs/${fileName}`;

    return {
      url: publicUrl,
      key: fileName,
      size: object.size,
      expiresAt: expiresAt.toISOString(),
      etag: object.etag,
    };
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError(`Failed to upload PDF to R2: ${errorMessage}`, {
      fileName,
      error: errorMessage,
    });
  }
}

/**
 * Generate a unique file name for a PDF
 *
 * Creates a unique file name using UUID v4 format with .pdf extension.
 * Format: `{uuid}.pdf` (e.g., '7f3a9b2c-4d1e-4a5b-8c6d-9e2f1a3b4c5d.pdf')
 *
 * @returns A unique PDF file name
 *
 * @example
 * ```typescript
 * const fileName = generatePdfFileName();
 * // Returns: '7f3a9b2c-4d1e-4a5b-8c6d-9e2f1a3b4c5d.pdf'
 * ```
 */
export function generatePdfFileName(): string {
  return `${crypto.randomUUID()}.pdf`;
}

/**
 * Delete a PDF file from R2
 *
 * Removes a PDF from R2 storage. Used for cleanup or GDPR deletion requests.
 *
 * @param bucket - The R2 bucket binding
 * @param fileName - The file name/key to delete
 * @throws StorageError if deletion fails
 *
 * @example
 * ```typescript
 * await deletePdfFromR2(env.R2_BUCKET, 'invoice-123.pdf');
 * ```
 */
export async function deletePdfFromR2(bucket: R2Bucket, fileName: string): Promise<void> {
  try {
    await bucket.delete(fileName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError(`Failed to delete PDF from R2: ${errorMessage}`, {
      fileName,
      error: errorMessage,
    });
  }
}

/**
 * Check if a PDF exists in R2
 *
 * Verifies that a PDF file exists in R2 storage.
 *
 * @param bucket - The R2 bucket binding
 * @param fileName - The file name/key to check
 * @returns true if the file exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await pdfExistsInR2(env.R2_BUCKET, 'invoice-123.pdf');
 * if (exists) {
 *   console.log('PDF found in storage');
 * }
 * ```
 */
export async function pdfExistsInR2(bucket: R2Bucket, fileName: string): Promise<boolean> {
  try {
    const object = await bucket.head(fileName);
    return object !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get PDF metadata from R2
 *
 * Retrieves metadata about a PDF file stored in R2 without downloading the file.
 *
 * @param bucket - The R2 bucket binding
 * @param fileName - The file name/key
 * @returns Object metadata or null if not found
 *
 * @example
 * ```typescript
 * const metadata = await getPdfMetadata(env.R2_BUCKET, 'invoice-123.pdf');
 * if (metadata) {
 *   console.log('File size:', metadata.size);
 *   console.log('Uploaded at:', metadata.uploaded);
 * }
 * ```
 */
export async function getPdfMetadata(
  bucket: R2Bucket,
  fileName: string
): Promise<R2Object | null> {
  try {
    return await bucket.head(fileName);
  } catch (error) {
    return null;
  }
}

/**
 * List expired PDFs that should be deleted
 *
 * Queries R2 for PDFs that have exceeded their 30-day TTL.
 * This can be used in a scheduled cleanup job.
 *
 * @param bucket - The R2 bucket binding
 * @param limit - Maximum number of objects to list (default: 1000)
 * @returns Array of expired PDF file names
 *
 * @example
 * ```typescript
 * const expiredPdfs = await listExpiredPdfs(env.R2_BUCKET);
 * for (const fileName of expiredPdfs) {
 *   await deletePdfFromR2(env.R2_BUCKET, fileName);
 * }
 * ```
 */
export async function listExpiredPdfs(bucket: R2Bucket, limit = 1000): Promise<string[]> {
  const expiredFiles: string[] = [];
  const now = new Date();

  try {
    const listed = await bucket.list({ limit });

    for (const object of listed.objects) {
      // Check if object has expiration metadata
      const expiresAt = object.customMetadata?.expiresAt;
      if (expiresAt) {
        const expirationDate = new Date(expiresAt);
        if (expirationDate < now) {
          expiredFiles.push(object.key);
        }
      }
    }

    return expiredFiles;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new StorageError(`Failed to list expired PDFs: ${errorMessage}`);
  }
}

/**
 * Calculate the public CDN URL for a PDF
 *
 * Constructs the public URL for accessing a PDF via Cloudflare CDN.
 * Note: Requires custom domain configuration in R2 settings.
 *
 * @param fileName - The PDF file name
 * @param customDomain - Optional custom domain (default: cdn.speedstein.com)
 * @returns The public URL
 *
 * @example
 * ```typescript
 * const url = getPdfPublicUrl('invoice-123.pdf');
 * // Returns: 'https://cdn.speedstein.com/pdfs/invoice-123.pdf'
 * ```
 */
export function getPdfPublicUrl(fileName: string, customDomain = 'cdn.speedstein.com'): string {
  return `https://${customDomain}/pdfs/${fileName}`;
}
