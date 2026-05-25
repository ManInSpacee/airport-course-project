import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("создание нового рейса через форму", async ({ page }) => {
  await login(page);

  await page.getByRole("button", { name: /Добавить рейс|Add flight/ }).click();
  await page.waitForURL(/\/flights\/new/, { timeout: 5000 });

  await page.locator("select").first().selectOption("SU");

  const flightNumber = `SU-${Math.floor(Math.random() * 9000) + 1000}`;
  await page.locator('input[placeholder="SU-100"]').fill(flightNumber);

  await page.locator("select").nth(1).selectOption({ index: 1 });

  await page.locator("select").nth(3).selectOption("Сочи (AER)");

  const dep = new Date(Date.now() + 24 * 3600000);
  const arr = new Date(Date.now() + 26 * 3600000);
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  await page.locator('input[type="datetime-local"]').first().fill(fmt(dep));
  await page.locator('input[type="datetime-local"]').nth(1).fill(fmt(arr));

  await page.getByRole("button", { name: /Сохранить|Save/ }).click();

  await page.waitForURL(/\/flights\/\d+/, { timeout: 10000 });
  await expect(page.locator("body")).toContainText(flightNumber);
});
