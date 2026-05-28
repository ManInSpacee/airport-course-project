import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("форма создания рейса отклоняет прошедшую дату вылета", async ({ page }) => {
  await login(page);

  await page.getByRole("button", { name: /Добавить рейс|Add flight/ }).click();
  await page.waitForURL(/\/flights\/new/, { timeout: 5000 });

  await page.locator("select").first().selectOption("SU");

  const flightNumber = `SU-${Math.floor(Math.random() * 9000) + 1000}`;
  await page.locator('input[placeholder="SU-100"]').fill(flightNumber);

  await page.locator("select").nth(1).selectOption({ index: 1 });
  await page.locator("select").nth(3).selectOption("Сочи (AER)");

  const past = new Date(Date.now() - 24 * 3600000);
  const future = new Date(Date.now() + 2 * 3600000);
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  await page.locator('input[type="datetime-local"]').first().fill(fmt(past));
  await page.locator('input[type="datetime-local"]').nth(1).fill(fmt(future));

  await page.getByRole("button", { name: /Сохранить|Save/ }).click();

  await expect(page).toHaveURL(/\/flights\/new/);
  await expect(page.locator(".err-msg").first()).toBeVisible({ timeout: 3000 });
});
