import { expect, test, type Page } from "@playwright/test";

const password = "DanceHub123!";
const fixtureOrganizationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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

test("application approval creates the initial Owner workspace", async ({ page }) => {
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login/);

  await login(page, "applicant@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}`);
  await expect(page.locator('.notice[role="alert"]')).toContainText("アクセスする権限がありません");

  await page.getByRole("link", { name: "Organizationを申請" }).click();
  await page.getByLabel(/Organization名/).fill("E2E Dance Organization");
  await page.getByLabel("Webサイト").fill("https://dance.example.com");
  await page.getByRole("button", { name: "審査へ提出" }).click();
  await expect(page.getByText("Organization申請を提出しました。")).toBeVisible();
  await logout(page);

  await login(page, "admin@example.com");
  await page.getByRole("link", { name: /Organization申請の審査キュー/ }).click();
  const review = page.getByRole("article").filter({ hasText: "E2E Dance Organization" });
  await expect(review).toBeVisible();
  await review.getByLabel("審査メモ / 却下理由").fill("Identity confirmed");
  await review.getByRole("button", { name: "承認" }).click();
  await expect(page.getByText("審査結果を保存しました。")).toBeVisible();
  await logout(page);

  await login(page, "applicant@example.com");
  await expect(page.getByRole("link", { name: "通知 (1)" })).toBeVisible();
  await page.getByRole("link", { name: "通知 (1)" }).click();
  await expect(page.getByRole("heading", { name: "Organization申請が承認されました" })).toBeVisible();
  await expect(page.getByText("E2E Dance Organization", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "DANCE HUB" }).click();
  const organizationCard = page.getByRole("link").filter({ hasText: "E2E Dance Organization" });
  await expect(organizationCard).toContainText("owner");
  await organizationCard.click();
  await expect(page.getByRole("heading", { name: "E2E Dance Organization" })).toBeVisible();
  await page.getByRole("link", { name: "Organization設定" }).click();
  await expect(page.getByText("MemberとRoleの管理はOwnerだけが行えます。")).toBeVisible();
  await logout(page);

  await login(page, "editor@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/settings`);
  await expect(page.locator('.notice[role="alert"]')).toContainText("Owner権限が必要です");
});
