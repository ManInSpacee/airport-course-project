import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("смена статуса рейса на DELAYED", async ({ page }) => {
  await login(page);

  const firstRow = page.locator("table.tbl tbody tr").first();
  await expect(firstRow).toBeVisible({ timeout: 10000 });

  await firstRow
    .getByRole("button", { name: /Изменить статус|Change status/ })
    .click();

  await page.locator("select").last().selectOption("DELAYED");
  await page.getByRole("button", { name: /Применить|Apply/ }).click();

  await expect(firstRow.locator(".st").first()).toContainText("Задержан", { timeout: 5000 });
});
