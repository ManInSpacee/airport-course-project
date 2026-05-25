import { Page, expect } from '@playwright/test'

export async function login(page: Page, email = 'admin@airport.com', password = 'admin123') {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /Войти|Sign in/ }).click()
  await page.waitForURL(/\/flights/, { timeout: 10000 })
  await expect(page).toHaveURL(/\/flights/)
}
