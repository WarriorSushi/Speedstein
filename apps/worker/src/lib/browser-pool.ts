/**
 * Browser Session Pool
 *
 * Manages a pool of warm Chrome browser contexts for PDF generation.
 * Implements FIFO eviction with 5-minute idle timeout and 1-hour max age.
 *
 * Pool Configuration:
 * - Exactly 8 warm Chrome contexts maintained
 * - FIFO eviction after 5min idle
 * - Maximum pool age: 1 hour
 * - Automatic disposal on worker shutdown
 *
 * @packageDocumentation
 */

import { BrowserError } from '@speedstein/shared/lib/errors';

/**
 * Browser page wrapper with metadata
 */
interface PooledPage {
  /** The Puppeteer page instance */
  page: any;

  /** When this page was created */
  createdAt: Date;

  /** When this page was last used */
  lastUsedAt: Date;

  /** Whether this page is currently in use */
  inUse: boolean;

  /** Unique ID for this page */
  id: string;
}

/**
 * Browser pool configuration
 */
export interface BrowserPoolConfig {
  /** Number of warm browser contexts to maintain */
  poolSize: number;

  /** Maximum idle time before page eviction (milliseconds) */
  maxIdleTime: number;

  /** Maximum age for a page before forced recreation (milliseconds) */
  maxPageAge: number;

  /** Puppeteer browser instance or launch function */
  browser: any;
}

/**
 * Browser Session Pool
 *
 * Maintains a pool of warm Chrome browser pages for fast PDF generation.
 * Implements FIFO eviction and automatic cleanup.
 *
 * @example
 * ```typescript
 * const pool = new BrowserPool({
 *   poolSize: 8,
 *   maxIdleTime: 5 * 60 * 1000, // 5 minutes
 *   maxPageAge: 60 * 60 * 1000, // 1 hour
 *   browser: await puppeteer.launch(),
 * });
 *
 * const page = await pool.getPage();
 * try {
 *   // Use page for PDF generation
 * } finally {
 *   await pool.releasePage(page);
 * }
 * ```
 */
export class BrowserPool {
  private pool: PooledPage[] = [];
  private config: BrowserPoolConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: BrowserPoolConfig) {
    this.config = {
      poolSize: config.poolSize ?? 8,
      maxIdleTime: config.maxIdleTime ?? 5 * 60 * 1000, // 5 minutes
      maxPageAge: config.maxPageAge ?? 60 * 60 * 1000, // 1 hour
      browser: config.browser,
    };

    // Start cleanup interval to evict idle and old pages
    this.startCleanupInterval();
  }

  /**
   * Get a page from the pool
   *
   * Returns an available page or creates a new one if pool is not full.
   * If pool is full and all pages are in use, waits for a page to become available.
   *
   * @returns A browser page ready for use
   * @throws BrowserError if unable to get a page
   */
  async getPage(): Promise<any> {
    try {
      // Try to find an available page
      const availablePage = this.pool.find((p) => !p.inUse);

      if (availablePage) {
        // Mark as in use and update last used time
        availablePage.inUse = true;
        availablePage.lastUsedAt = new Date();
        return availablePage.page;
      }

      // No available pages - check if we can create a new one
      if (this.pool.length < this.config.poolSize) {
        const newPage = await this.createPage();
        return newPage.page;
      }

      // Pool is full and all pages are in use - wait for one to become available
      // This implements backpressure
      return await this.waitForAvailablePage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BrowserError(`Failed to get browser page from pool: ${errorMessage}`);
    }
  }

  /**
   * Release a page back to the pool
   *
   * Marks the page as available for reuse.
   *
   * @param page - The page to release
   */
  async releasePage(page: any): Promise<void> {
    const pooledPage = this.pool.find((p) => p.page === page);

    if (pooledPage) {
      pooledPage.inUse = false;
      pooledPage.lastUsedAt = new Date();

      // Check if page should be evicted due to age
      if (this.shouldEvictDueToAge(pooledPage)) {
        await this.evictPage(pooledPage);
      }
    }
  }

  /**
   * Create a new browser page and add to pool
   * @private
   */
  private async createPage(): Promise<PooledPage> {
    try {
      // Create new page from browser
      const page = await this.config.browser.newPage();

      // Disable images and unnecessary resources for faster loading (optional)
      // await page.setRequestInterception(true);
      // page.on('request', (req: any) => {
      //   if (req.resourceType() === 'image') {
      //     req.abort();
      //   } else {
      //     req.continue();
      //   }
      // });

      const pooledPage: PooledPage = {
        page,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        inUse: true,
        id: crypto.randomUUID(),
      };

      this.pool.push(pooledPage);

      return pooledPage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BrowserError(`Failed to create browser page: ${errorMessage}`);
    }
  }

  /**
   * Wait for a page to become available
   * @private
   */
  private async waitForAvailablePage(): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const availablePage = this.pool.find((p) => !p.inUse);

        if (availablePage) {
          clearInterval(checkInterval);
          availablePage.inUse = true;
          availablePage.lastUsedAt = new Date();
          resolve(availablePage.page);
        }
      }, 100); // Check every 100ms

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new BrowserError('Timeout waiting for available browser page'));
      }, 30000);
    });
  }

  /**
   * Check if a page should be evicted due to age
   * @private
   */
  private shouldEvictDueToAge(pooledPage: PooledPage): boolean {
    const age = Date.now() - pooledPage.createdAt.getTime();
    return age > this.config.maxPageAge;
  }

  /**
   * Check if a page should be evicted due to idle time
   * @private
   */
  private shouldEvictDueToIdle(pooledPage: PooledPage): boolean {
    const idleTime = Date.now() - pooledPage.lastUsedAt.getTime();
    return idleTime > this.config.maxIdleTime && !pooledPage.inUse;
  }

  /**
   * Evict a page from the pool
   * @private
   */
  private async evictPage(pooledPage: PooledPage): Promise<void> {
    try {
      // Close the page
      await pooledPage.page.close();

      // Remove from pool
      const index = this.pool.indexOf(pooledPage);
      if (index > -1) {
        this.pool.splice(index, 1);
      }
    } catch (error) {
      // Log error but don't throw - eviction failures shouldn't break the pool
      console.error('Error evicting page:', error);
    }
  }

  /**
   * Cleanup interval to evict idle and old pages
   * @private
   */
  private startCleanupInterval(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdlePages();
    }, 60 * 1000);
  }

  /**
   * Clean up idle and old pages (FIFO eviction)
   * @private
   */
  private async cleanupIdlePages(): Promise<void> {
    const pagesToEvict: PooledPage[] = [];

    // Find pages to evict (idle or old)
    for (const pooledPage of this.pool) {
      if (this.shouldEvictDueToIdle(pooledPage) || this.shouldEvictDueToAge(pooledPage)) {
        pagesToEvict.push(pooledPage);
      }
    }

    // Evict pages (FIFO - oldest first)
    for (const page of pagesToEvict) {
      await this.evictPage(page);
    }
  }

  /**
   * Get pool statistics
   *
   * Returns information about the current state of the pool.
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    avgAge: number;
    avgIdleTime: number;
  } {
    const now = Date.now();

    const total = this.pool.length;
    const inUse = this.pool.filter((p) => p.inUse).length;
    const available = total - inUse;

    const ages = this.pool.map((p) => now - p.createdAt.getTime());
    const idleTimes = this.pool.map((p) => now - p.lastUsedAt.getTime());

    const avgAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
    const avgIdleTime =
      idleTimes.length > 0
        ? idleTimes.reduce((sum, time) => sum + time, 0) / idleTimes.length
        : 0;

    return {
      total,
      available,
      inUse,
      avgAge,
      avgIdleTime,
    };
  }

  /**
   * Dispose of all pages and clean up resources
   *
   * Should be called on worker shutdown.
   */
  async dispose(): Promise<void> {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all pages
    const closePromises = this.pool.map((pooledPage) => pooledPage.page.close());

    try {
      await Promise.all(closePromises);
    } catch (error) {
      console.error('Error disposing browser pool:', error);
    }

    // Clear pool
    this.pool = [];
  }
}
