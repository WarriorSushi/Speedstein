/**
 * Email Verification Page
 * Phase 3: User Story 1 (T032)
 * Handles email verification token from URL and redirects to dashboard
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
          setStatus('error');
          setError('Invalid verification link');
          return;
        }

        // Verify the email using the token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'email',
        });

        if (verifyError) {
          setStatus('error');
          setError(verifyError.message);
          return;
        }

        // Success - email verified
        setStatus('success');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setError('An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [searchParams, router, supabase.auth]);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        {status === 'loading' && (
          <Card>
            <CardHeader>
              <CardTitle>Verifying your email...</CardTitle>
              <CardDescription>Please wait while we verify your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'success' && (
          <Card>
            <CardHeader>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>Your account has been successfully verified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {status === 'error' && (
          <Card>
            <CardHeader>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>We couldn&apos;t verify your email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                The verification link may have expired or is invalid. Please try signing up again or
                contact support if the problem persists.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/signup">Sign Up</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
