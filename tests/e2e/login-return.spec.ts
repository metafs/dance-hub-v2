import { expect, test, type Page } from "@playwright/test";

// A signed-out user who opens a link into the workspace or the admin queues
// lands on that page after signing in, and the sign-in form never sends
// anyone to another site, whatever `next` says.

const password = "DanceHub123!";
const organizationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

async function signIn(page: Page, email: string) {
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
}

test("an Organizer returns to the page they opened before signing in", async ({ page }) => {
  const target = `/workspace/${organizationId}/events?tab=all`;
  await page.goto(target);
  await expect(page).toHaveURL(`/login?next=${encodeURIComponent(target)}`);

  await signIn(page, "owner@example.com");
  await expect(page).toHaveURL(target);
});

test("a Platform Admin returns to the review queue they opened", async ({ page }) => {
  await page.goto("/admin/events");
  await expect(page).toHaveURL(`/login?next=${encodeURIComponent("/admin/events")}`);

  await signIn(page, "admin@example.com");
  await expect(page).toHaveURL("/admin/events");
});

test("next cannot send a user to another site", async ({ page }) => {
  for (const next of ["//example.com", "/\t/example.com", "/\\example.com"]) {
    await page.context().clearCookies();
    await page.goto(`/login?next=${encodeURIComponent(next)}`);
    await signIn(page, "owner@example.com");
    await expect(page, JSON.stringify(next)).toHaveURL("/workspace");
  }
});
