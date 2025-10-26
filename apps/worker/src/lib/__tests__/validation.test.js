/**
 * Unit tests for Zod validation schemas
 * Tests HTML validation and PDF options validation
 *
 * @see apps/worker/src/lib/validation.ts
 */
import { describe, it, expect } from 'vitest';
import { PdfGenerationRequestSchema, ApiKeySchema } from '../validation';
import { ZodError } from 'zod';
describe('validation schemas', () => {
    describe('PdfGenerationRequestSchema', () => {
        it('should validate valid HTML with minimal options', () => {
            const validInput = {
                html: '<html><body><h1>Test</h1></body></html>',
            };
            const result = PdfGenerationRequestSchema.parse(validInput);
            expect(result.html).toBe(validInput.html);
            expect(result.options).toBeUndefined();
        });
        it('should validate HTML with full options', () => {
            const validInput = {
                html: '<html><body><h1>Invoice</h1></body></html>',
                options: {
                    format: 'A4',
                    orientation: 'landscape',
                    printBackground: true,
                    margin: {
                        top: '1cm',
                        right: '1cm',
                        bottom: '1cm',
                        left: '1cm',
                    },
                    scale: 1.5,
                    displayHeaderFooter: true,
                    headerTemplate: '<div>Header</div>',
                    footerTemplate: '<div>Page <span class="pageNumber"></span></div>',
                    preferCSSPageSize: false,
                },
            };
            const result = PdfGenerationRequestSchema.parse(validInput);
            expect(result.html).toBe(validInput.html);
            expect(result.options?.format).toBe('A4');
            expect(result.options?.landscape).toBe(true);
            expect(result.options?.scale).toBe(1.5);
        });
        it('should reject empty HTML', () => {
            const invalidInput = { html: '' };
            expect(() => PdfGenerationRequestSchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should reject missing HTML field', () => {
            const invalidInput = {};
            expect(() => PdfGenerationRequestSchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should reject HTML larger than 10MB', () => {
            // Create HTML > 10MB (10,485,760 bytes)
            const largeHtml = 'a'.repeat(10_485_761);
            const invalidInput = { html: largeHtml };
            expect(() => PdfGenerationRequestSchema.parse(invalidInput)).toThrow(ZodError);
            try {
                PdfGenerationRequestSchema.parse(invalidInput);
            }
            catch (error) {
                if (error instanceof ZodError) {
                    expect(error.errors[0].message).toContain('10MB');
                }
            }
        });
        it('should reject invalid page format', () => {
            const invalidInput = {
                html: '<html><body>Test</body></html>',
                options: {
                    format: 'InvalidFormat',
                },
            };
            expect(() => PdfGenerationRequestSchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should reject invalid orientation', () => {
            const invalidInput = {
                html: '<html><body>Test</body></html>',
                options: {
                    orientation: 'diagonal',
                },
            };
            expect(() => PdfGenerationRequestSchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should reject scale outside valid range', () => {
            const invalidInput1 = {
                html: '<html><body>Test</body></html>',
                options: { scale: 0.05 }, // Too small
            };
            const invalidInput2 = {
                html: '<html><body>Test</body></html>',
                options: { scale: 3.0 }, // Too large
            };
            expect(() => PdfGenerationRequestSchema.parse(invalidInput1)).toThrow(ZodError);
            expect(() => PdfGenerationRequestSchema.parse(invalidInput2)).toThrow(ZodError);
        });
        it('should validate scale within valid range (0.1 to 2.0)', () => {
            const validInput = {
                html: '<html><body>Test</body></html>',
                options: { scale: 1.0 },
            };
            const result = PdfGenerationRequestSchema.parse(validInput);
            expect(result.options?.scale).toBe(1.0);
        });
        it('should reject non-string margin values', () => {
            const invalidInput = {
                html: '<html><body>Test</body></html>',
                options: {
                    margin: {
                        top: 10, // Should be string like '10mm'
                    },
                },
            };
            expect(() => PdfGenerationRequestSchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should validate all supported page formats', () => {
            const formats = ['A4', 'A3', 'Letter', 'Legal', 'Tabloid'];
            formats.forEach((format) => {
                const validInput = {
                    html: '<html><body>Test</body></html>',
                    options: { format },
                };
                const result = PdfGenerationRequestSchema.parse(validInput);
                expect(result.options?.format).toBe(format);
            });
        });
        it('should handle HTML with special characters', () => {
            const validInput = {
                html: '<html><body><h1>Test & "Quotes" < > \'Single\'</h1></body></html>',
            };
            const result = PdfGenerationRequestSchema.parse(validInput);
            expect(result.html).toBe(validInput.html);
        });
        it('should handle HTML with unicode characters', () => {
            const validInput = {
                html: '<html><body><h1>Hello 世界 🌍</h1></body></html>',
            };
            const result = PdfGenerationRequestSchema.parse(validInput);
            expect(result.html).toBe(validInput.html);
        });
    });
    describe('ApiKeySchema', () => {
        it('should validate valid API key name', () => {
            const validInput = { name: 'Production API Key' };
            const result = ApiKeySchema.parse(validInput);
            expect(result.name).toBe('Production API Key');
        });
        it('should trim whitespace from name', () => {
            const validInput = { name: '  Staging  ' };
            const result = ApiKeySchema.parse(validInput);
            expect(result.name).toBe('Staging');
        });
        it('should reject empty name', () => {
            const invalidInput = { name: '' };
            expect(() => ApiKeySchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should reject name with only whitespace', () => {
            const invalidInput = { name: '   ' };
            expect(() => ApiKeySchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should reject name longer than 100 characters', () => {
            const invalidInput = { name: 'a'.repeat(101) };
            expect(() => ApiKeySchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should accept name with maximum length (100 chars)', () => {
            const validInput = { name: 'a'.repeat(100) };
            const result = ApiKeySchema.parse(validInput);
            expect(result.name).toHaveLength(100);
        });
        it('should reject missing name field', () => {
            const invalidInput = {};
            expect(() => ApiKeySchema.parse(invalidInput)).toThrow(ZodError);
        });
        it('should accept name with special characters', () => {
            const validInput = { name: 'API-Key_2024 (Production)' };
            const result = ApiKeySchema.parse(validInput);
            expect(result.name).toBe('API-Key_2024 (Production)');
        });
    });
    describe('validatePdfOptions', () => {
        it('should provide helpful error messages for invalid format', () => {
            const invalidInput = {
                html: '<html><body>Test</body></html>',
                options: { format: 'B5' },
            };
            try {
                PdfGenerationRequestSchema.parse(invalidInput);
            }
            catch (error) {
                if (error instanceof ZodError) {
                    const formatError = error.errors.find((e) => e.path.includes('format'));
                    expect(formatError).toBeDefined();
                    expect(formatError?.message).toContain('Invalid');
                }
            }
        });
        it('should validate header and footer templates', () => {
            const validInput = {
                html: '<html><body>Test</body></html>',
                options: {
                    displayHeaderFooter: true,
                    headerTemplate: '<div style="font-size: 10px;">Company Name</div>',
                    footerTemplate: '<div style="font-size: 10px;">Page <span class="pageNumber"></span></div>',
                },
            };
            const result = PdfGenerationRequestSchema.parse(validInput);
            expect(result.options?.headerTemplate).toContain('Company Name');
            expect(result.options?.footerTemplate).toContain('pageNumber');
        });
    });
});
