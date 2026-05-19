import { test, expect } from '@playwright/test'

// Сквозной тест 1: вход в систему
test('авторизация администратора', async ({ page }) => {
  await page.goto('/')

  await page.fill('input[type="email"]', 'admin@airport.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')

  await expect(page).not.toHaveURL(/login/)
  await expect(page.locator('text=Рейсы').or(page.locator('text=Flights')).first()).toBeVisible()
})

// Сквозной тест 2: неверный пароль → остаёмся на странице входа
test('ошибка при неверном пароле', async ({ page }) => {
  await page.goto('/')

  await page.fill('input[type="email"]', 'admin@airport.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/login|^\/$/)
  const error = page.locator('text=Неверный').or(page.locator('text=ошибка')).or(page.locator('[class*="error"]'))
  await expect(error.first()).toBeVisible()
})

// Сквозной тест 3: просмотр списка рейсов после входа
test('список рейсов отображается после авторизации', async ({ page }) => {
  await page.goto('/')
  await page.fill('input[type="email"]', 'admin@airport.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')

  await page.waitForURL(/(?!.*login)/)

  await page.goto('/flights')
  await expect(page.locator('table, [class*="flight"], [class*="list"]').first()).toBeVisible()
})
