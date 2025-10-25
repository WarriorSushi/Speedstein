import { z } from 'zod'

// PDF Generation Options Schema
export const PdfOptionsSchema = z.object({
  format: z.enum(['A4', 'A3', 'Letter', 'Legal', 'Tabloid']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  printBackground: z.boolean().default(true),
  margin: z.object({
    top: z.string().default('1cm'),
    right: z.string().default('1cm'),
    bottom: z.string().default('1cm'),
    left: z.string().default('1cm'),
  }).optional(),
  scale: z.number().min(0.1).max(2.0).default(1.0),
  displayHeaderFooter: z.boolean().default(false),
  headerTemplate: z.string().optional(),
  footerTemplate: z.string().optional(),
})

export type PdfOptions = z.infer<typeof PdfOptionsSchema>

// PDF Generation Request Schema
export const PdfGenerationRequestSchema = z.object({
  html: z.string().max(10 * 1024 * 1024), // 10MB max
  options: PdfOptionsSchema.optional(),
})

export type PdfGenerationRequest = z.infer<typeof PdfGenerationRequestSchema>

// PDF Generation Result
export interface PdfGenerationResult {
  success: boolean
  url?: string
  generationTime?: number
  size?: number
  expiresAt?: string
  error?: {
    code: string
    message: string
  }
}
