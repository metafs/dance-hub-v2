import { expect, test } from "@playwright/test";

// DH-33: the listing policy is public, reachable from every public page, and
// numbered the same way as the rejection notices that cite it (G-3).

test("a Visitor can read the listing policy from any public page", async ({ page }) => {
  await page.goto("/events");
  await page.getByRole("contentinfo").getByRole("link", { name: "掲載基準" }).click();

  await expect(page).toHaveURL(/\/listing-policy$/);
  await expect(page.getByRole("heading", { name: "掲載基準", level: 1 })).toBeVisible();
  for (const section of ["A. 対象", "B. 掲載に必要な情報", "D. 掲載しないもの", "F. 中止と掲載の取り下げ"]) {
    await expect(page.getByRole("heading", { name: section, level: 2 })).toBeVisible();
  }
  await expect(page.getByText("B-7", { exact: true })).toBeVisible();

  // The page points to the withdrawal intake it promises (F-1).
  await page.getByRole("main").getByRole("link", { name: "掲載の削除・修正を依頼する" }).click();
  await expect(page).toHaveURL(/\/listing-requests$/);
});
