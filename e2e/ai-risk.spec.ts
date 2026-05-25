import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('AI-прогноз риска задержки для существующего рейса', async ({ page }) => {
  await login(page)

  await expect(page.locator('table.tbl tbody tr').first()).toBeVisible({ timeout: 10000 })

  const aiButton = page.locator('table.tbl tbody tr').first().locator('button[aria-label*="AI"], button[aria-label*="ai"]')
  await aiButton.click()

  await page.waitForURL(/\/flights\/\d+\/risk/, { timeout: 5000 })

  await expect(page.locator('.risk-level')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.risk-level')).toHaveText(/LOW|MEDIUM|HIGH/)
})
