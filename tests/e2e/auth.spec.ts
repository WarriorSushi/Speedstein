/**
 * Authentication E2E Tests
 *
 * Tests for User Story 1 (Authentication):
 * - T028: Signup flow, email verification, login, dashboard access, route protection
 *
 * Constitution Compliance:
 * - Principle II (Security): Authentication flows must work correctly
 * - Principle VII (UX): 3-minute signup target with 90% success rate
 * - Principle VIII (Testing): E2E coverage for critical user flows
 *
 * @packageDocumentation
 */

import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_EMAIL = `test-${Date.now()}@speedstein.test`;
const TEST_PASSWORD = 'TestPass123!';

test.describe('Authentication Flow', () => {
  test('should complete full signup flow', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');

    // Fill out signup form
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Verify confirmation message
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 5000 });

    // Verify email format
    expect(TEST_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup');

    // Try invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign up/i }).click();

    // Verify error message
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('should validate password length (min 8 characters)', async ({ page }) => {
    await page.goto('/signup');

    // Try short password
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill('short');
    await page.getByRole('button', { name: /sign up/i }).click();

    // Verify error message
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    // This test would need a pre-existing user
    // Skip in CI, only run locally with setup
    test.skip(process.env.CI === 'true', 'Requires pre-existing user');

    await page.goto('/signup');

    // Use a known existing email
    await page.getByLabel(/email/i).fill('existing@speedstein.test');
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign up/i }).click();

    // Verify error message
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});

test.describe('Login Flow', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');

    // Verify form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();

    // Verify "Forgot Password" link
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try invalid credentials
    await page.getByLabel(/email/i).fill('nonexistent@speedstein.test');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Verify error message
    await expect(page.getByText(/invalid.*credentials|incorrect.*password|login failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test requires a pre-existing valid user
    test.skip(process.env.CI === 'true', 'Requires valid test user');

    await page.goto('/login');

    // Fill valid credentials (these would be set up in test environment)
    await page.getByLabel(/email/i).fill('testuser@speedstein.test');
    await page.getByLabel(/password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Dashboard Access & Route Protection', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show dashboard after authentication', async ({ page }) => {
    // This test requires authenticated session
    test.skip(process.env.CI === 'true', 'Requires authenticated session');

    await page.goto('/dashboard');

    // Verify dashboard elements
    await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible();

    // Verify navigation exists
    await expect(page.getByRole('link', { name: /api keys/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /usage/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /billing/i })).toBeVisible();
  });

  test('should show Free tier for new users', async ({ page }) => {
    // This test requires authenticated session
    test.skip(process.env.CI === 'true', 'Requires authenticated session');

    await page.goto('/dashboard');

    // Verify Free tier indicator
    await expect(page.getByText(/free.*tier|plan.*free/i)).toBeVisible();

    // Verify 0 usage initially
    await expect(page.getByText(/0.*pdfs?|usage.*0/i)).toBeVisible();
  });
});

test.describe('Password Reset Flow', () => {
  test('should show forgot password page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot password/i }).click();

    // Verify password reset form
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|send/i })).toBeVisible();
  });

  test('should send password reset email', async ({ page }) => {
    await page.goto('/reset-password');

    // Fill email
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByRole('button', { name: /reset|send/i }).click();

    // Verify confirmation message
    await expect(page.getByText(/check your email|reset link sent/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Logout Flow', () => {
  test('should show logout button when authenticated', async ({ page }) => {
    // This test requires authenticated session
    test.skip(process.env.CI === 'true', 'Requires authenticated session');

    await page.goto('/dashboard');

    // Verify logout button exists
    const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
    await expect(logoutButton).toBeVisible();
  });

  test('should redirect to home after logout', async ({ page }) => {
    // This test requires authenticated session
    test.skip(process.env.CI === 'true', 'Requires authenticated session');

    await page.goto('/dashboard');

    // Click logout
    await page.getByRole('button', { name: /log out|sign out/i }).click();

    // Verify redirect to home or login
    await expect(page).toHaveURL(/\/login|\/$/);

    // Verify cannot access dashboard anymore
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Session Management', () => {
  test('should persist session across page reloads', async ({ page }) => {
    // This test requires authenticated session
    test.skip(process.env.CI === 'true', 'Requires authenticated session');

    await page.goto('/dashboard');

    // Reload page
    await page.reload();

    // Verify still on dashboard (session persisted)
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should handle expired sessions gracefully', async ({ page }) => {
    // This test would require session manipulation
    test.skip(true, 'Requires session expiration simulation');

    await page.goto('/dashboard');

    // Simulate expired session (would need to clear cookies or wait)
    // await page.context().clearCookies();

    // Try to perform action
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
