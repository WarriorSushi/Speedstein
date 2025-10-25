import { test, expect } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Speedstein/)
  await expect(page.getByRole('heading', { name: /Speedstein/i })).toBeVisible()
})
