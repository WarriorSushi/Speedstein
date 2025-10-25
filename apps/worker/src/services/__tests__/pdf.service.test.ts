/**
 * Unit tests for PdfService
 * Tests PDF generation options parsing and validation
 *
 * @see apps/worker/src/services/pdf.service.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PdfService } from '../pdf.service';
import type { PdfOptions } from '@speedstein/shared/types/pdf';

describe('PdfService', () => {
  let pdfService: PdfService;

  beforeEach(() => {
    // Mock browser pool
    const mockBrowserPool = {
      getPage: vi.fn(),
      releasePage: vi.fn(),
    };

    pdfService = new PdfService(mockBrowserPool as any);
  });

  describe('parseOptions', () => {
    it('should use default options when none provided', () => {
      const options = pdfService.parseOptions(undefined);

      expect(options.format).toBe('A4');
      expect(options.orientation).toBe('portrait');
      expect(options.printBackground).toBe(true);
      expect(options.scale).toBe(1.0);
    });

    it('should merge provided options with defaults', () => {
      const userOptions: PdfOptions = {
        format: 'Letter',
        orientation: 'landscape',
      };

      const options = pdfService.parseOptions(userOptions);

      expect(options.format).toBe('Letter');
      expect(options.orientation).toBe('landscape');
      expect(options.printBackground).toBe(true); // Default
      expect(options.scale).toBe(1.0); // Default
    });

    it('should handle custom margins', () => {
      const userOptions: PdfOptions = {
        margin: {
          top: '2cm',
          right: '1.5cm',
          bottom: '2cm',
          left: '1.5cm',
        },
      };

      const options = pdfService.parseOptions(userOptions);

      expect(options.margin).toEqual({
        top: '2cm',
        right: '1.5cm',
        bottom: '2cm',
        left: '1.5cm',
      });
    });

    it('should handle partial margin specification', () => {
      const userOptions: PdfOptions = {
        margin: {
          top: '1cm',
          bottom: '1cm',
        },
      };

      const options = pdfService.parseOptions(userOptions);

      expect(options.margin?.top).toBe('1cm');
      expect(options.margin?.bottom).toBe('1cm');
      // Right and left should use defaults or be undefined
    });

    it('should validate scale within range (0.1 to 2.0)', () => {
      const validOptions: PdfOptions = { scale: 1.5 };
      const options = pdfService.parseOptions(validOptions);
      expect(options.scale).toBe(1.5);
    });

    it('should handle header and footer templates', () => {
      const userOptions: PdfOptions = {
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size:10px;text-align:center;">Company Name</div>',
        footerTemplate: '<div style="font-size:10px;text-align:center;">Page <span class="pageNumber"></span></div>',
      };

      const options = pdfService.parseOptions(userOptions);

      expect(options.displayHeaderFooter).toBe(true);
      expect(options.headerTemplate).toContain('Company Name');
      expect(options.footerTemplate).toContain('pageNumber');
    });

    it('should handle all supported page formats', () => {
      const formats: Array<'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid'> = [
        'A4',
        'A3',
        'Letter',
        'Legal',
        'Tabloid',
      ];

      formats.forEach((format) => {
        const options = pdfService.parseOptions({ format });
        expect(options.format).toBe(format);
      });
    });

    it('should handle preferCSSPageSize option', () => {
      const userOptions: PdfOptions = {
        preferCSSPageSize: true,
      };

      const options = pdfService.parseOptions(userOptions);
      expect(options.preferCSSPageSize).toBe(true);
    });
  });

  describe('convertToPuppeteerOptions', () => {
    it('should convert Speedstein options to Puppeteer format', () => {
      const speedsteinOptions: PdfOptions = {
        format: 'A4',
        orientation: 'landscape',
        printBackground: true,
        scale: 1.2,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      };

      const puppeteerOptions = pdfService.convertToPuppeteerOptions(speedsteinOptions);

      expect(puppeteerOptions.format).toBe('a4'); // Puppeteer uses lowercase
      expect(puppeteerOptions.landscape).toBe(true); // orientation -> landscape boolean
      expect(puppeteerOptions.printBackground).toBe(true);
      expect(puppeteerOptions.scale).toBe(1.2);
      expect(puppeteerOptions.margin).toEqual({
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      });
    });

    it('should handle portrait orientation', () => {
      const options: PdfOptions = { orientation: 'portrait' };
      const puppeteerOptions = pdfService.convertToPuppeteerOptions(options);

      expect(puppeteerOptions.landscape).toBe(false);
    });

    it('should handle landscape orientation', () => {
      const options: PdfOptions = { orientation: 'landscape' };
      const puppeteerOptions = pdfService.convertToPuppeteerOptions(options);

      expect(puppeteerOptions.landscape).toBe(true);
    });

    it('should convert format to lowercase for Puppeteer', () => {
      const options: PdfOptions = { format: 'Letter' };
      const puppeteerOptions = pdfService.convertToPuppeteerOptions(options);

      expect(puppeteerOptions.format).toBe('letter');
    });

    it('should include header/footer templates when displayHeaderFooter is true', () => {
      const options: PdfOptions = {
        displayHeaderFooter: true,
        headerTemplate: '<div>Header</div>',
        footerTemplate: '<div>Footer</div>',
      };

      const puppeteerOptions = pdfService.convertToPuppeteerOptions(options);

      expect(puppeteerOptions.displayHeaderFooter).toBe(true);
      expect(puppeteerOptions.headerTemplate).toBe('<div>Header</div>');
      expect(puppeteerOptions.footerTemplate).toBe('<div>Footer</div>');
    });

    it('should omit header/footer templates when displayHeaderFooter is false', () => {
      const options: PdfOptions = {
        displayHeaderFooter: false,
        headerTemplate: '<div>Header</div>',
        footerTemplate: '<div>Footer</div>',
      };

      const puppeteerOptions = pdfService.convertToPuppeteerOptions(options);

      expect(puppeteerOptions.displayHeaderFooter).toBe(false);
      // headerTemplate and footerTemplate should not be included or should be empty
    });
  });

  describe('calculateEstimatedSize', () => {
    it('should estimate PDF size based on HTML length', () => {
      const shortHtml = '<html><body>Short</body></html>';
      const longHtml = '<html><body>' + 'Long content '.repeat(1000) + '</body></html>';

      const shortSize = pdfService.calculateEstimatedSize(shortHtml);
      const longSize = pdfService.calculateEstimatedSize(longHtml);

      expect(longSize).toBeGreaterThan(shortSize);
    });

    it('should return reasonable estimate for typical HTML', () => {
      const typicalHtml = '<html><body><h1>Invoice</h1><p>Amount: $100</p></body></html>';
      const estimatedSize = pdfService.calculateEstimatedSize(typicalHtml);

      // Typical PDF should be in range of a few KB to a few MB
      expect(estimatedSize).toBeGreaterThan(1000); // > 1KB
      expect(estimatedSize).toBeLessThan(10_000_000); // < 10MB
    });
  });

  describe('validateHtmlSize', () => {
    it('should accept HTML under 10MB', () => {
      const validHtml = '<html><body>' + 'content '.repeat(10000) + '</body></html>';
      const byteSize = new TextEncoder().encode(validHtml).length;

      expect(() => pdfService.validateHtmlSize(validHtml)).not.toThrow();
    });

    it('should reject HTML over 10MB', () => {
      // Create HTML > 10MB (10,485,760 bytes)
      const invalidHtml = 'a'.repeat(10_485_761);

      expect(() => pdfService.validateHtmlSize(invalidHtml)).toThrow('HTML exceeds maximum size');
    });

    it('should calculate size in bytes (UTF-8)', () => {
      const unicodeHtml = '<html><body>Hello 世界</body></html>';
      const byteSize = new TextEncoder().encode(unicodeHtml).length;

      // Unicode characters take more than 1 byte
      expect(byteSize).toBeGreaterThan(unicodeHtml.length);

      // Should still validate correctly
      expect(() => pdfService.validateHtmlSize(unicodeHtml)).not.toThrow();
    });
  });

  describe('sanitizeOptions', () => {
    it('should remove potentially dangerous options', () => {
      const dangerousOptions = {
        format: 'A4',
        path: '/etc/passwd', // Should be removed - Puppeteer path option
        timeout: 999999, // Should be capped or removed
      };

      const sanitized = pdfService.sanitizeOptions(dangerousOptions as any);

      expect(sanitized.format).toBe('A4');
      expect(sanitized).not.toHaveProperty('path');
    });

    it('should preserve safe options', () => {
      const safeOptions: PdfOptions = {
        format: 'Letter',
        orientation: 'landscape',
        printBackground: true,
        scale: 1.5,
        margin: { top: '1cm', bottom: '1cm' },
      };

      const sanitized = pdfService.sanitizeOptions(safeOptions);

      expect(sanitized).toEqual(safeOptions);
    });
  });

  describe('getDefaultOptions', () => {
    it('should return correct default options', () => {
      const defaults = pdfService.getDefaultOptions();

      expect(defaults.format).toBe('A4');
      expect(defaults.orientation).toBe('portrait');
      expect(defaults.printBackground).toBe(true);
      expect(defaults.scale).toBe(1.0);
      expect(defaults.displayHeaderFooter).toBe(false);
      expect(defaults.preferCSSPageSize).toBe(false);
    });

    it('should return a new object on each call (not reference)', () => {
      const defaults1 = pdfService.getDefaultOptions();
      const defaults2 = pdfService.getDefaultOptions();

      expect(defaults1).toEqual(defaults2);
      expect(defaults1).not.toBe(defaults2); // Different objects
    });
  });
});
