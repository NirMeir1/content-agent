import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("complete no-key pilot journey persists and exports", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(page).toHaveTitle(/Bottomline/);
  await expect(
    page.getByRole("heading", { name: "תוכן שמתחיל בעסק שלך." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "נסה עם עסק לדוגמה" }).click();
  await expect(
    page.getByRole("heading", { name: "מה כדאי לעשות השבוע?" }),
  ).toBeVisible();
  await page.screenshot({
    path: `output/qa/${testInfo.project.name}-home.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "העסק שלי", exact: true }).click();
  await page.getByRole("button", { name: "1. מכירים את העסק" }).click();
  const business = "עסק בדיקה " + testInfo.project.name;
  await page.getByLabel("שם העסק", { exact: true }).fill(business);
  await page
    .getByLabel("תחום העיסוק", { exact: true })
    .fill("ייעוץ ותכנון בדיקה");
  await page.getByRole("button", { name: "שמירת פרטים", exact: true }).click();
  await expect(page.getByText("השינויים נשמרו", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "העסק שלי", exact: true }).click();
  await expect(page.getByLabel("שם העסק", { exact: true })).toHaveValue(
    business,
  );
  await expect(page.getByLabel("תחום העיסוק", { exact: true })).toHaveValue(
    "ייעוץ ותכנון בדיקה",
  );
  await page.getByRole("button", { name: "תוכנית התוכן", exact: true }).click();
  await page
    .getByRole("button", { name: "עריכת רעיון", exact: true })
    .first()
    .click();
  const title = "רעיון שעודכן " + testInfo.project.name;
  await page.getByLabel("כותרת הרעיון").fill(title);
  const month = await page.getByLabel("חודש התוכנית").inputValue();
  await page.getByLabel("תאריך מתוכנן").fill(month + "-11");
  await page.getByRole("button", { name: "שמירת רעיון", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "תוכנית התוכן", exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  // Change date AND format on an idea without an existing draft.
  await page
    .getByRole("button", { name: "עריכת רעיון", exact: true })
    .last()
    .click();
  await page.getByLabel("פורמט", { exact: true }).selectOption("story");
  await page.getByLabel("תאריך מתוכנן").fill(month + "-25");
  await page.getByRole("button", { name: "שמירת רעיון", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "טיוטות ואישורים", exact: true })
    .click();
  await page.locator(".draft-row").first().click();
  const original = await page
    .getByLabel("כיתוב הפוסט", { exact: true })
    .inputValue();
  const beforeVersions = await page
    .getByLabel("צפייה בגרסה קודמת")
    .locator("option")
    .count();
  const caption = "עריכה שנשמרה " + testInfo.project.name;
  await page.getByLabel("כיתוב הפוסט", { exact: true }).fill(caption);
  await page.getByRole("button", { name: "שמירת עריכה כגרסה חדשה" }).click();
  await expect(
    page.getByLabel("צפייה בגרסה קודמת").locator("option"),
  ).toHaveCount(beforeVersions + 1);
  await page.getByLabel("צפייה בגרסה קודמת").selectOption({ index: 1 });
  await expect(page.locator(".text-preview")).toContainText(
    testInfo.project.name === "desktop" ? original : "כשיש הרבה",
  );
  await page.getByRole("button", { name: "אישור טיוטה", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "איך הייתה התוצאה?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "העתקת כיתוב" }).click();
  await expect(page.getByText("הכיתוב הועתק", { exact: true })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain(caption);
  const textDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "ייצוא טקסט", exact: true }).click();
  const draftFile = await textDownload;
  expect(draftFile.suggestedFilename()).toBe("bottomline-draft.txt");
  expect(await readFile((await draftFile.path())!, "utf8")).toContain(caption);
  await page.getByRole("button", { name: "מוכן לפרסום", exact: true }).click();
  await expect(
    page.getByText("מוכן לפרסום ידני", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "חזרה לטיוטות" }).click();
  await page.locator(".draft-row").nth(3).click();
  await page.getByLabel("בקשת תיקון או סיבת דחייה").fill("לא נשמע כמוני");
  await page.getByRole("button", { name: "דחיית טיוטה", exact: true }).click();
  await page.getByRole("button", { name: "העסק שלי", exact: true }).click();
  await expect(
    page.getByText("מקור: לא נשמע כמוני", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "משוב על הניסוי", exact: true })
    .click();
  await page.getByLabel("דקות לפוסט בדרך הרגילה (רשות)").fill("45");
  await page.getByLabel("דקות בדיקה ועריכה כאן (הערכה שלך)").fill("7");
  await page
    .getByLabel("מה עבד ומה כדאי לשנות?")
    .fill("בדיקת משוב " + testInfo.project.name);
  await page.getByRole("button", { name: "שמירת משוב", exact: true }).click();
  await expect(
    page.getByText("בדיקת משוב " + testInfo.project.name, { exact: true }),
  ).toBeVisible();
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "ייצוא נתוני הניסוי JSON" }).click();
  const file = await jsonDownload;
  expect(file.suggestedFilename()).toBe("bottomline-pilot.json");
  const exported = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(exported.profile.business).toBe(business);
  expect(
    exported.reviews.some(
      (r: { reason: string }) => r.reason === "לא נשמע כמוני",
    ),
  ).toBe(true);
  expect(
    exported.feedback.some(
      (f: { baseline: number; minutes: number }) =>
        f.baseline === 45 && f.minutes === 7,
    ),
  ).toBe(true);
  expect(
    exported.ideas.some(
      (i: { date: string; format: string }) =>
        i.date === month + "-25" && i.format === "story",
    ),
  ).toBe(true);
  await page.reload();
  await page
    .getByRole("button", { name: "טיוטות ואישורים", exact: true })
    .click();
  await page.locator(".draft-row").first().click();
  await expect(page.getByLabel("כיתוב הפוסט", { exact: true })).toHaveValue(
    caption,
  );
  await page.screenshot({
    path: `output/qa/${testInfo.project.name}-studio.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
  expect(errors).toEqual([]);
});
