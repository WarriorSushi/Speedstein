/**
 * Login Page
 * Phase 3: User Story 1 (T031)
 * User login page with email/password form
 */

import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export const metadata = {
  title: 'Log In | Speedstein',
  description: 'Sign in to your Speedstein account',
};

export default function LoginPage() {
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
            Sign in to Speedstein
          </h1>
          <p className="text-sm text-muted-foreground">
            Access your dashboard and API keys
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
