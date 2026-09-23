import { expect, test } from "@playwright/test";

// Listing policy C-5 to C-8 and G-6: a Platform Admin records an Event the
// operator entered from public information, and from then on its public page
// says so and offers the Organizer a correction route (M4.1, DH-22).

const password = "DanceHub123!";
// The seeded past Event carries no image, which a proxy listing must not have (C-8).
const pastEventId = "e0000005-0000-4000-8000-000000000005";
const pastEvent = "フィクスチャ 過去公演";

test("a proxy listing names who entered it and where to correct it", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.com");
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/workspace/);

  await page.goto("/admin/withdrawals");
  const proxy = page.getByRole("region", { name: "代理入力として識別する" });
  await proxy.getByLabel("Event ID").fill(pastEventId);
  await proxy.getByRole("button", { name: "代理入力として識別" }).click();
  await expect(page.getByText("Eventを代理入力として識別しました。")).toBeVisible();

  // The rest runs as a Visitor.
  await page.context().clearCookies();

  await page.goto(`/events/${pastEventId}`);
  await expect(page.getByRole("heading", { name: pastEvent, level: 1 })).toBeVisible();
  await expect(page.getByText("この情報は、公開されている告知をもとに p8ce 運営が掲載しました。")).toBeVisible();

  await page.getByRole("link", { name: "内容の修正を依頼する" }).click();
  await expect(page).toHaveURL(`/listing-requests?event=${pastEventId}&kind=correction`);
  await expect(page.getByRole("heading", { name: "掲載内容の修正を依頼する", level: 1 })).toBeVisible();
});
