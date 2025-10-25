import { z } from 'zod'
import { PdfOptionsSchema } from '../types/pdf'

/**
 * Schema for PDF generation request
 */
export const GeneratePdfSchema = z.object({
  html: z.string().min(1).max(10 * 1024 * 1024), // 10MB max
  options: PdfOptionsSchema.optional(),
})

/**
 * Schema for creating an API key
 */
export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
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
