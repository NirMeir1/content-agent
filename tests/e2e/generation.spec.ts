import { test, expect } from "@playwright/test";
test("blank onboarding, planning, explicit drafting and revisions work without a key", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "הגדר את העסק שלי", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "העסק שלי", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "1. מכירים את העסק" }).click();
  await page
    .getByLabel("שם העסק", { exact: true })
    .fill("סטודיו פיילוט " + testInfo.project.name);
  await page.getByLabel("תחום העיסוק", { exact: true }).fill("תכנון זמן");
  await page.getByRole("button", { name: "שמירה והמשך" }).click();
  await page
    .getByLabel("למי התוכן מיועד?", { exact: true })
    .fill("עצמאיות בתחילת הדרך");
  await page
    .getByLabel("מה מעסיק את הקהל?", { exact: true })
    .fill("עומס משימות");
  await page
    .getByLabel("מה תרצי לקדם?", { exact: true })
    .fill("שיחות על סדרי עדיפויות");
  await page.getByRole("button", { name: "שמירת פרטים", exact: true }).click();
  await expect(page.getByText("השינויים נשמרו", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "תוכנית התוכן", exact: true }).click();
  await page
    .getByLabel("חודש התוכנית")
    .fill(testInfo.project.name === "desktop" ? "2027-03" : "2027-04");
  await page
    .getByRole("button", { name: "בנה לי תוכנית תוכן", exact: true })
    .click();
  await expect(
    page.getByText("דוגמת הדגמה — לא נוצרה באמצעות AI", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".idea-card")).toHaveCount(8);
  await expect(
    page.getByRole("heading", { name: "הכיוון לחודש הזה" }),
  ).toBeVisible();
  await page.screenshot({
    path: `output/qa/${testInfo.project.name}-plan.png`,
    fullPage: true,
  });
  await page
    .locator(".idea-card")
    .first()
    .getByRole("button", { name: "אישור רעיון", exact: true })
    .click();
  await page
    .locator(".idea-card")
    .first()
    .getByRole("button", { name: "יצירת טיוטה", exact: true })
    .click();
  await page
    .locator(".idea-card")
    .first()
    .getByRole("button", { name: "פתיחת טיוטה", exact: true })
    .click();
  const initial = await page
    .getByLabel("כיתוב הפוסט", { exact: true })
    .inputValue();
  await page.getByRole("button", { name: "קצר יותר", exact: true }).click();
  await expect(
    page.getByLabel("צפייה בגרסה קודמת").locator("option"),
  ).toHaveCount(3);
  expect(
    (await page.getByLabel("כיתוב הפוסט", { exact: true }).inputValue()).length,
  ).toBeLessThanOrEqual(initial.length);
  await expect(
    page.getByText("דוגמת הדגמה — לא נוצרה באמצעות AI", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "העסק שלי", exact: true }).click();
  await expect(
    page.getByText("מקור: קצר יותר", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "החלפת סביבת עבודה", exact: true })
    .click();
  await page
    .getByRole("button", { name: "נסה עם עסק לדוגמה", exact: true })
    .click();
  await page
    .getByRole("button", { name: "טיוטות ואישורים", exact: true })
    .click();
  expect(await page.locator(".draft-row").count()).toBeGreaterThanOrEqual(4);
});
