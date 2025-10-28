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
});
/**
 * Schema for user signup
 */
export const SignupSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(1).max(100).optional(),
});
/**
 * Schema for user login
 */
export const LoginSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
});
/**
 * Schema for password reset request
 */
export const ResetPasswordRequestSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
});
/**
 * Schema for password reset confirmation
 */
export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});
/**
 * Schema for email verification
 */
export const VerifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});
/**
 * Schema for user profile update
 */
export const UpdateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email('Invalid email address').toLowerCase().optional(),
    darkModePreference: z.boolean().optional(),
});
/**
 * Schema for subscription checkout
 */
export const CheckoutSchema = z.object({
    planTier: z.enum(['starter', 'pro', 'enterprise']),
    billingInterval: z.enum(['month', 'year']).default('month'),
});
/**
 * Schema for subscription upgrade
 */
export const UpgradeSubscriptionSchema = z.object({
    newPlan: z.enum(['starter', 'pro', 'enterprise']),
});
/**
 * Schema for subscription downgrade
 */
export const DowngradeSubscriptionSchema = z.object({
    newPlan: z.enum(['free', 'starter']),
});
/**
 * Schema for payment webhook events
 */
export const PaymentWebhookSchema = z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    eventType: z.enum([
        'subscription.created',
        'subscription.updated',
        'payment.succeeded',
        'payment.failed',
        'subscription.cancelled',
    ]),
    userId: z.string().uuid('Invalid user ID'),
    data: z.record(z.unknown()),
    signature: z.string().min(1, 'Webhook signature is required'),
});
/**
 * Validation Helper Functions
 */
/**
 * Safe parse with user-friendly error messages
 */
export function validateInput(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    // Convert Zod errors to user-friendly format
    const errors = {};
    result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });
    return {
        success: false,
        errors,
    };
}
/**
 * Validate and throw on error
 */
export function validateOrThrow(schema, data) {
    return schema.parse(data);
}
/**
 * Email validation helper
 */
export function isValidEmail(email) {
    return z.string().email().safeParse(email).success;
}
/**
 * Password strength validation helper
 */
export function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (password.length > 100) {
        errors.push('Password must be less than 100 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
