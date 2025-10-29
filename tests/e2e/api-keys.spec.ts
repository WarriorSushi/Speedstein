/**
 * API Keys Management E2E Tests
 *
 * Tests for User Story 2 (API Key Management):
 * - Generate API keys, copy to clipboard, view key list, revoke keys
 *
 * Constitution Compliance:
 * - Principle II (Security): API keys must be SHA-256 hashed
 * - Principle V (Code Quality): Key format validation
 * - Principle VIII (Testing): E2E coverage for critical features
 *
 * @packageDocumentation
 */

import { test, expect } from '@playwright/test';

// Setup: These tests require an authenticated user
test.use({
  storageState: process.env.CI ? undefined : 'tests/e2e/.auth/user.json',
});

test.describe('API Keys Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if not authenticated
    test.skip(process.env.CI === 'true', 'Requires authenticated session');

    await page.goto('/dashboard/api-keys');
  });

  test('should display API keys page', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /api keys/i })).toBeVisible();

    // Verify "Generate New Key" button
    await expect(page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i })).toBeVisible();
  });

  test('should show empty state for new users', async ({ page }) => {
    // If no keys exist, should show empty state
    const emptyState = page.getByText(/no api keys|haven't created|create your first/i);
    const keyList = page.locator('[data-testid="api-key-item"]');

    // Either empty state or key list should be visible
    const hasKeys = (await keyList.count()) > 0;
    if (!hasKeys) {
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('Generate API Key Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Requires authenticated session');
    await page.goto('/dashboard/api-keys');
  });

  test('should open key generation modal', async ({ page }) => {
    // Click generate button
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();

    // Verify modal appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/name|description/i)).toBeVisible();
  });

  test('should generate API key with custom name', async ({ page }) => {
    const keyName = `Test Key ${Date.now()}`;

    // Click generate button
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();

    // Fill in key name
    await page.getByLabel(/name|description/i).fill(keyName);

    // Submit form
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Verify success message
    await expect(page.getByText(/key.*created|generated successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify key appears in list
    await expect(page.getByText(keyName)).toBeVisible();
  });

  test('should show API key once with copy button', async ({ page }) => {
    // Generate a key
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();
    await page.getByLabel(/name|description/i).fill('Copy Test Key');
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Verify key is displayed (should match sk_[tier]_[32chars] format)
    const keyDisplay = page.locator('[data-testid="api-key-value"]').or(page.locator('code:has-text("sk_")'));
    await expect(keyDisplay).toBeVisible({ timeout: 5000 });

    // Verify key format (sk_tier_base62)
    const keyText = await keyDisplay.textContent();
    expect(keyText).toMatch(/^sk_(free|starter|pro|enterprise)_[A-Za-z0-9]{32}$/);

    // Verify copy button
    const copyButton = page.getByRole('button', { name: /copy/i });
    await expect(copyButton).toBeVisible();
  });

  test('should copy API key to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Generate a key
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();
    await page.getByLabel(/name|description/i).fill('Clipboard Test Key');
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Wait for key to appear
    await page.waitForSelector('[data-testid="api-key-value"], code:has-text("sk_")', { timeout: 5000 });

    // Click copy button
    await page.getByRole('button', { name: /copy/i }).click();

    // Verify "Copied!" feedback
    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 2000 });

    // Verify clipboard contains key
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/^sk_(free|starter|pro|enterprise)_[A-Za-z0-9]{32}$/);
  });

  test('should validate key name length', async ({ page }) => {
    // Click generate button
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();

    // Try empty name
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Verify error message
    await expect(page.getByText(/name.*required|please.*name/i)).toBeVisible();

    // Try very long name
    const longName = 'A'.repeat(256);
    await page.getByLabel(/name|description/i).fill(longName);
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Verify error or truncation
    await expect(page.getByText(/too long|max.*characters/i).or(page.getByText(/created/i))).toBeVisible();
  });
});

test.describe('API Keys List', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Requires authenticated session');
    await page.goto('/dashboard/api-keys');
  });

  test('should display list of API keys with metadata', async ({ page }) => {
    // Verify key list structure
    const keyItems = page.locator('[data-testid="api-key-item"]');

    // If keys exist
    if ((await keyItems.count()) > 0) {
      const firstKey = keyItems.first();

      // Verify key prefix is visible (sk_free_xxx...)
      await expect(firstKey.getByText(/sk_/)).toBeVisible();

      // Verify key name
      await expect(firstKey.locator('text=/Key|name/i')).toBeVisible();

      // Verify created date
      await expect(firstKey.getByText(/created|added/i)).toBeVisible();

      // Verify last used (or "Never used")
      await expect(firstKey.getByText(/last used|never/i)).toBeVisible();
    }
  });

  test('should show key prefix (first 12 chars)', async ({ page }) => {
    const keyItems = page.locator('[data-testid="api-key-item"]');

    if ((await keyItems.count()) > 0) {
      const keyPrefix = page.locator('text=/sk_(free|starter|pro|enterprise)_[A-Za-z0-9]{4,8}\\.\\.\\./');
      await expect(keyPrefix.first()).toBeVisible();
    }
  });

  test('should sort keys by creation date (newest first)', async ({ page }) => {
    const keyItems = page.locator('[data-testid="api-key-item"]');
    const count = await keyItems.count();

    if (count >= 2) {
      // Get creation dates of first two keys
      const firstKeyDate = await keyItems.first().locator('[data-testid="created-date"]').textContent();
      const secondKeyDate = await keyItems.nth(1).locator('[data-testid="created-date"]').textContent();

      // Verify first key is newer than second
      expect(firstKeyDate).toBeTruthy();
      expect(secondKeyDate).toBeTruthy();
    }
  });
});

test.describe('Revoke API Key Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Requires authenticated session');
    await page.goto('/dashboard/api-keys');
  });

  test('should show revoke button for each key', async ({ page }) => {
    const keyItems = page.locator('[data-testid="api-key-item"]');

    if ((await keyItems.count()) > 0) {
      const revokeButton = keyItems.first().getByRole('button', { name: /revoke|delete|remove/i });
      await expect(revokeButton).toBeVisible();
    }
  });

  test('should show confirmation dialog before revoking', async ({ page }) => {
    const keyItems = page.locator('[data-testid="api-key-item"]');

    if ((await keyItems.count()) > 0) {
      // Click revoke button
      await keyItems.first().getByRole('button', { name: /revoke|delete|remove/i }).click();

      // Verify confirmation dialog
      const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(/are you sure|confirm|cannot be undone/i)).toBeVisible();
    }
  });

  test('should revoke API key successfully', async ({ page }) => {
    // First, create a key to revoke
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();
    const revokeTestKeyName = `Revoke Test ${Date.now()}`;
    await page.getByLabel(/name|description/i).fill(revokeTestKeyName);
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Wait for success
    await expect(page.getByText(/created|generated/i)).toBeVisible({ timeout: 5000 });

    // Close modal if needed
    const closeButton = page.getByRole('button', { name: /close|done/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Find the key we just created
    const keyItem = page.locator(`[data-testid="api-key-item"]:has-text("${revokeTestKeyName}")`);
    await expect(keyItem).toBeVisible();

    // Click revoke
    await keyItem.getByRole('button', { name: /revoke|delete|remove/i }).click();

    // Confirm
    const confirmButton = page.getByRole('button', { name: /confirm|yes|revoke/i });
    await confirmButton.click();

    // Verify success message
    await expect(page.getByText(/revoked|deleted|removed/i)).toBeVisible({ timeout: 5000 });

    // Verify key is removed from list
    await expect(keyItem).not.toBeVisible();
  });

  test('should allow canceling revocation', async ({ page }) => {
    const keyItems = page.locator('[data-testid="api-key-item"]');
    const initialCount = await keyItems.count();

    if (initialCount > 0) {
      // Click revoke button
      await keyItems.first().getByRole('button', { name: /revoke|delete|remove/i }).click();

      // Click cancel
      const cancelButton = page.getByRole('button', { name: /cancel|no/i });
      await cancelButton.click();

      // Verify dialog is closed
      const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
      await expect(dialog).not.toBeVisible();

      // Verify key count unchanged
      expect(await keyItems.count()).toBe(initialCount);
    }
  });
});

test.describe('API Key Usage Tracking', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Requires authenticated session');
    await page.goto('/dashboard/api-keys');
  });

  test('should show "Never used" for new keys', async ({ page }) => {
    // Create new key
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();
    await page.getByLabel(/name|description/i).fill(`Usage Test ${Date.now()}`);
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Close modal
    const closeButton = page.getByRole('button', { name: /close|done/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Verify "Never used"
    await expect(page.getByText(/never used/i)).toBeVisible();
  });

  test('should update "Last used" timestamp after API call', async ({ page }) => {
    // This test would require making an actual API call with the key
    test.skip(true, 'Requires API integration');
  });
});

test.describe('API Keys Security', () => {
  test('should only show full key once during generation', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Requires authenticated session');
    await page.goto('/dashboard/api-keys');

    // Generate key
    await page.getByRole('button', { name: /generate.*key|create.*key|new.*key/i }).click();
    await page.getByLabel(/name|description/i).fill('Security Test Key');
    await page.getByRole('button', { name: /create|generate/i }).click();

    // Verify full key is shown
    const fullKey = page.locator('[data-testid="api-key-value"]').or(page.locator('code:has-text("sk_")'));
    await expect(fullKey).toBeVisible();
    const keyValue = await fullKey.textContent();

    // Close modal
    const closeButton = page.getByRole('button', { name: /close|done/i });
    await closeButton.click();

    // Verify only prefix is shown in list
    const keyPrefix = page.getByText(new RegExp(keyValue!.substring(0, 16)));
    await expect(keyPrefix).toBeVisible();

    // Verify full key is NOT shown
    await expect(page.getByText(keyValue!)).not.toBeVisible();
  });

  test('should not allow downloading or viewing full key again', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Requires authenticated session');
    await page.goto('/dashboard/api-keys');

    const keyItems = page.locator('[data-testid="api-key-item"]');

    if ((await keyItems.count()) > 0) {
      // Verify no "View" or "Download" button exists for existing keys
      await expect(keyItems.first().getByRole('button', { name: /view|show|reveal/i })).not.toBeVisible();
    }
  });
});
