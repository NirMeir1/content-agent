import { test, expect } from "@playwright/test";
test("structured carousel, story and reel editors persist edits", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "נסה עם עסק לדוגמה", exact: true })
    .click();
  await page
    .getByRole("button", { name: "טיוטות ואישורים", exact: true })
    .click();
  for (const [index, label] of [
    [1, "טקסט שקופית 1"],
    [2, "טקסט על המסך 1"],
    [3, "טקסט מדובר 1"],
  ] as const) {
    await page.locator(".draft-row").nth(index).click();
    const value = "בדיקת מבנה " + index + " " + testInfo.project.name;
    await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole("button", { name: "שמירת עריכה כגרסה חדשה" }).click();
    await expect(
      page.getByRole("button", { name: "שמירת עריכה כגרסה חדשה" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "חזרה לטיוטות" }).click();
    await page.locator(".draft-row").nth(index).click();
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (index === 3)
      await expect(page.getByText(/תסריט ובריף בלבד/)).toBeVisible();
    await page.getByRole("button", { name: "חזרה לטיוטות" }).click();
  }
});
