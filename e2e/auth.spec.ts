import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('успешный вход и защита приватных страниц от анонима', async ({ page }) => {
  await page.goto('/flights')
  await page.waitForURL(/\/login/, { timeout: 5000 })
  await expect(page).toHaveURL(/\/login/)

  await login(page)
})
