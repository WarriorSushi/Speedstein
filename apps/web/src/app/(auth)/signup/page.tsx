/**
 * Signup Page
 * Phase 3: User Story 1 (T030)
 * User registration page with email/password form
 */

import { SignupForm } from '@/components/auth/signup-form';
import Link from 'next/link';

export const metadata = {
  title: 'Sign Up | Speedstein',
  description: 'Create your Speedstein account',
};

export default function SignupPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center text-sm font-medium hover:underline"
      >
        ← Back to home
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Speedstein
          </h1>
          <p className="text-sm text-muted-foreground">
            Fast, reliable PDF generation API
          </p>
        </div>

        <SignupForm />

        <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking Sign Up, you agree to our{' '}
          <a href="/terms" className="underline hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
