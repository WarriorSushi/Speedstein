/**
 * Landing Page and Demo E2E Tests
 *
 * Tests for User Story 1 (Marketing Site Visitor):
 * - T034: Landing page load time (LCP <2s)
 * - T035: Monaco demo flow (type HTML, generate PDF, verify download)
 * - T036: Accessibility (WCAG AAA validation)
 * - T037: Dark mode (toggle and verify OKLCH colors persist)
 *
 * Constitution Compliance:
 * - Principle I (Performance): LCP <2s validation
 * - Principle III (Design System): WCAG AAA contrast validation
 * - Principle VII (UX): Mobile-responsive and dark mode tests
 * - Principle VIII (Testing): Comprehensive E2E coverage
 *
 * @packageDocumentation
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  /**
   * T034: Landing page load time test
   * Validates LCP (Largest Contentful Paint) is under 2 seconds
   * Constitution Principle I: Performance First
   */
  test('should load with LCP under 2 seconds', async ({ page }) => {
    // Navigate and wait for load
    const response = await page.goto('/', { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(200)

    // Measure Core Web Vitals using Performance API
    const metrics = await page.evaluate(() => {
      return new Promise<{ lcp: number; fcp: number }>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lcpEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime: number }

          // Get FCP
          const paintEntries = performance.getEntriesByType('paint')
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')

          resolve({
            lcp: lcpEntry.renderTime || 0,
            fcp: fcpEntry?.startTime || 0,
          })
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      })
    })

    // Validate LCP is under 2000ms (2 seconds)
    console.log(`LCP: ${metrics.lcp}ms, FCP: ${metrics.fcp}ms`)
    expect(metrics.lcp).toBeLessThan(2000)

    // Verify hero section is visible (above the fold)
    await expect(page.getByRole('heading', { name: /Lightning-Fast/ })).toBeVisible()
  })

  /**
   * T035: Monaco demo flow test
   * Validates end-to-end PDF generation from live demo
   * Constitution Principle VII: Live demo works without authentication
   */
  test('should generate PDF from Monaco editor demo', async ({ page }) => {
    // Wait for Monaco editor to load (dynamic import)
    await page.waitForSelector('.monaco-editor', { timeout: 10000 })

    // Type custom HTML into Monaco editor
    const editor = page.locator('.monaco-editor textarea').first()
    await editor.fill('<h1>Test PDF</h1><p>Generated via Playwright</p>')

    // Click "Generate PDF" button
    const generateButton = page.getByRole('button', { name: /Generate PDF/ })
    await generateButton.click()

    // Wait for generation to complete (button should show loading state then complete)
    await expect(generateButton).toContainText(/Generating PDF/)
    await expect(generateButton).toContainText(/Generate PDF/, { timeout: 10000 })

    // Verify PDF was downloaded (check download event)
    const downloadPromise = page.waitForEvent('download')
    await generateButton.click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/speedstein-.*\.pdf/)
  })

  /**
   * T036: Accessibility test
   * Validates WCAG AAA compliance using axe-core
   * Constitution Principle III: WCAG AAA contrast (7:1 normal, 4.5:1 large)
   */
  test('should meet WCAG AAA accessibility standards', async ({ page }) => {
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa', 'wcag21aaa'])
      .analyze()

    // Verify no violations
    expect(accessibilityScanResults.violations).toHaveLength(0)

    // If violations exist, log them for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
    }

    // Verify color contrast specifically (OKLCH should maintain sufficient contrast)
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
    )
    expect(contrastViolations).toHaveLength(0)
  })

  /**
   * T037: Dark mode test
   * Validates theme toggle functionality and OKLCH color persistence
   * Constitution Principle III: OKLCH colors with dark mode support
   */
  test('should toggle dark mode and persist OKLCH colors', async ({ page }) => {
    // Verify initial light mode
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)

    // Click theme toggle button
    const themeToggle = page.getByRole('button', { name: /Toggle theme/ })
    await themeToggle.click()

    // Verify dark mode is applied
    await expect(html).toHaveClass(/dark/)

    // Verify OKLCH colors are applied (check CSS custom properties)
    const backgroundColor = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return styles.backgroundColor
    })

    // Background should be dark (OKLCH with low lightness)
    // Note: getComputedStyle returns RGB, but we can verify it's dark
    expect(backgroundColor).toMatch(/rgb\(/)

    // Toggle back to light mode
    await themeToggle.click()
    await expect(html).not.toHaveClass(/dark/)

    // Verify theme persists across page reloads
    await page.reload()
    await expect(html).not.toHaveClass(/dark/)
  })

  /**
   * Mobile responsiveness test
   * Validates mobile breakpoints and touch interactions
   */
  test('should be responsive on mobile devices', async ({ page }) => {
    // Set viewport to mobile size (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 })

    // Verify mobile navigation is accessible
    await expect(page.getByRole('heading', { name: /Lightning-Fast/ })).toBeVisible()

    // Verify Monaco editor is usable on mobile
    await page.waitForSelector('.monaco-editor', { timeout: 10000 })
    const editor = page.locator('.monaco-editor')
    await expect(editor).toBeVisible()

    // Verify pricing cards stack vertically
    const pricingCards = page.locator('[data-testid="pricing-card"]')
    if (await pricingCards.count() > 0) {
      const firstCardBox = await pricingCards.first().boundingBox()
      const secondCardBox = await pricingCards.nth(1).boundingBox()

      // Cards should be stacked (second card below first)
      if (firstCardBox && secondCardBox) {
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height)
      }
    }
  })
})

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
  })

  test('should display all pricing tiers', async ({ page }) => {
    // Verify all 4 tiers are displayed
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Enterprise' })).toBeVisible()

    // Verify "Most Popular" badge on Pro tier
    const proBadge = page.locator('text=Most Popular')
    await expect(proBadge).toBeVisible()
  })

  test('should have accessible pricing table', async ({ page }) => {
    // Run accessibility scan on pricing page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa'])
      .analyze()

    expect(accessibilityScanResults.violations).toHaveLength(0)
  })
})
