import { expect, test, type Page } from "@playwright/test";

const password = "DanceHub123!";
const fixtureOrganizationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherOrganizationId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/workspace/);
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL("/");
}

test("candidate activation produces canonical data without cross-organization disclosure", async ({ page }) => {
  await login(page, "owner@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/entities`);
  await page.getByRole("heading", { name: "Artist Candidate" }).locator("..").getByLabel("Artist名").fill("E2E Artist");
  await page.getByRole("button", { name: "Artist候補を提出" }).click();
  await expect(page.getByText("E2E Artist")).toBeVisible();
  await logout(page);

  await login(page, "other@example.com");
  await page.goto(`/workspace/${otherOrganizationId}/entities`);
  await expect(page.getByText("E2E Artist")).toHaveCount(0);
  await logout(page);

  await login(page, "admin@example.com");
  await page.goto("/admin/entities");
  const review = page.getByRole("article").filter({ hasText: "E2E Artist" });
  await review.getByLabel("審査理由").fill("Verified for M3");
  await review.getByRole("button", { name: "承認・有効化" }).click();
  await expect(page.getByText("審査結果を保存しました。")).toBeVisible();
  await logout(page);

  await login(page, "owner@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/entities`);
  await expect(page.getByRole("article").filter({ hasText: "E2E Artist" })).toBeVisible();
});
