import { z } from 'zod';
import { MAX_HTML_SIZE_BYTES } from '../types/pdf';

/**
 * Schema for PDF generation options
 */
export const PdfOptionsSchema = z
  .object({
    format: z.enum(['A4', 'A3', 'Letter', 'Legal', 'Tabloid']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    printBackground: z.boolean().optional(),
    margin: z
      .object({
        top: z.string().optional(),
        right: z.string().optional(),
        bottom: z.string().optional(),
        left: z.string().optional(),
      })
      .optional(),
    scale: z.number().min(0.1).max(2.0).optional(),
    displayHeaderFooter: z.boolean().optional(),
    headerTemplate: z.string().optional(),
    footerTemplate: z.string().optional(),
    preferCSSPageSize: z.boolean().optional(),
  })
  .optional();

/**
 * Schema for PDF generation request
 * Validates HTML content and options
 */
export const GeneratePdfSchema = z.object({
  html: z
    .string()
    .min(1, 'HTML content is required and must be a non-empty string')
    .refine((html) => new TextEncoder().encode(html).length <= MAX_HTML_SIZE_BYTES, {
      message: `HTML content exceeds maximum size of 10MB`,
    }),
  options: PdfOptionsSchema,
});

/**
 * Schema for creating an API key
 */
export const CreateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'API key name is required')
    .max(100, 'API key name must be 100 characters or less')
    .transform((name) => name.trim())
    .refine((name) => name.length > 0, {
      message: 'API key name cannot be only whitespace',
    }),
})

/**
 * Schema for user signup
 */
export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
})

/**
 * Schema for user login
 */
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * Schema for subscription checkout
 */
export const CheckoutSchema = z.object({
  planTier: z.enum(['starter', 'pro', 'enterprise']),
  billingInterval: z.enum(['month', 'year']).default('month'),
})

/**
 * Schema for subscription upgrade
 */
export const UpgradeSubscriptionSchema = z.object({
  newPlan: z.enum(['starter', 'pro', 'enterprise']),
})

/**
 * Schema for subscription downgrade
 */
export const DowngradeSubscriptionSchema = z.object({
  newPlan: z.enum(['free', 'starter']),
})
