import { expect, test, type Page } from "@playwright/test";

import { latestAuthLink } from "./support/mailbox";

// ADR-0025: during the closed beta an Organizer account starts from a Platform
// Admin's invitation, and anyone can reset a forgotten password by email.

const adminPassword = "DanceHub123!";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
}

async function choosePassword(page: Page, password: string) {
  await page.locator('input[name="password"]').fill(password);
  await page.getByLabel("新しいパスワード（確認）").fill(password);
  await page.getByRole("button", { name: "パスワードを保存する" }).click();
  await expect(page).toHaveURL(/\/workspace\?passwordSet=1$/);
  await expect(page.getByText("パスワードを保存しました。")).toBeVisible();
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL("/");
}

test("an invited Organizer chooses a password, and can reset it later", async ({ page, baseURL }) => {
  const email = `invitee-${Date.now()}@example.com`;

  // A Platform Admin sends the invitation.
  await signIn(page, "admin@example.com", adminPassword);
  await expect(page).toHaveURL(/\/workspace/);
  await page.goto("/admin/invitations");
  const invitedAt = new Date();
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByRole("button", { name: "招待メールを送る" }).click();
  await expect(page.getByText("招待メールを送りました。")).toBeVisible();
  await signOut(page);

  // The link in the email signs the invitee in and asks for a password.
  await page.goto(await latestAuthLink(email, baseURL!, invitedAt));
  await expect(page).toHaveURL(/\/account\/password\?welcome=1$/);
  await expect(page.getByRole("heading", { name: "パスワードを決める" })).toBeVisible();
  await choosePassword(page, "first-password-1");

  // The new account can apply for an Organization, and signs in again.
  await expect(page.getByRole("link", { name: /Organizationを申請/ }).first()).toBeVisible();
  await signOut(page);
  await signIn(page, email, "first-password-1");
  await expect(page).toHaveURL(/\/workspace/);
  await signOut(page);

  // A forgotten password is reset through the same kind of link. The answer
  // does not reveal whether an address has an account.
  await page.goto("/login");
  await page.getByRole("link", { name: "パスワードを忘れた場合" }).click();
  const requestedAt = new Date();
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByRole("button", { name: "再設定のリンクを送る" }).click();
  const sent = page.getByRole("status");
  await expect(sent).toContainText("アカウントがあれば");

  await page.goto(await latestAuthLink(email, baseURL!, requestedAt));
  await expect(page).toHaveURL(/\/account\/password$/);
  await choosePassword(page, "second-password-2");
  await signOut(page);
  await signIn(page, email, "second-password-2");
  await expect(page).toHaveURL(/\/workspace/);
});

test("an unknown address gets the same answer, and a used link is refused", async ({ page }) => {
  await page.goto("/password/forgot");
  await page.getByLabel("メールアドレス").fill(`nobody-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "再設定のリンクを送る" }).click();
  await expect(page.getByRole("status")).toContainText("アカウントがあれば");

  await page.goto("/auth/confirm?type=recovery&token_hash=not-a-real-token");
  await expect(page).toHaveURL(/\/login\?error=link-invalid$/);
  await page.goto("/auth/confirm?type=signup&token_hash=anything");
  await expect(page).toHaveURL(/\/login\?error=link-invalid$/);
});

test("only a Platform Admin can open the invitation form", async ({ page }) => {
  await signIn(page, "owner@example.com", adminPassword);
  await expect(page).toHaveURL(/\/workspace/);
  await page.goto("/admin/invitations");
  await expect(page).toHaveURL(/\/workspace\?error=platform-admin-required$/);
});
