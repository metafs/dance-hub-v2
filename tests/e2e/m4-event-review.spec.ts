import { expect, test, type Page } from "@playwright/test";

const password = "DanceHub123!";
const fixtureOrganizationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const fixtureArtistId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const fixtureVenueId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const eventTitle = "M4 E2E Event";

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

test("Event revision is reviewed before public release, then cancellation remains public", async ({ page }) => {
  await login(page, "owner@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/events`);
  const draft = page.getByRole("heading", { name: "新しいEventを作成" }).locator("..");
  await draft.getByLabel("Event名").fill(eventTitle);
  await draft.getByLabel("説明").fill("First reviewable M4 event");
  await draft.locator('select[name="eventType"]').selectOption("performance");
  await draft.getByLabel("Artist（canonical）").selectOption(fixtureArtistId);
  await draft.getByLabel("会場（canonical）").selectOption(fixtureVenueId);
  await draft.getByLabel("開始日時（東京都）").fill("2030-04-01T19:00");
  await draft.getByLabel("終了日時（東京都）").fill("2030-04-01T20:30");
  const offers = draft.getByRole("group", { name: "Ticket Offer（料金）" });
  await offers.getByRole("button", { name: "料金を追加" }).click();
  const advance = offers.locator(".ticket-offer-row").nth(0);
  await advance.getByLabel("ラベル").fill("一般前売");
  await advance.getByLabel("金額（最小通貨単位）").fill("3000");
  await offers.getByRole("button", { name: "料金を追加" }).click();
  const under25 = offers.locator(".ticket-offer-row").nth(1);
  await under25.getByLabel("ラベル").fill("U25");
  await under25.getByLabel("金額（最小通貨単位）").fill("2000");
  await draft.getByLabel("object key").fill("events/m4-e2e/cover.jpg");
  await draft.getByLabel("content type").fill("image/jpeg");
  await draft.getByLabel("代替テキスト").fill("M4 E2E Eventのメイン画像");
  await draft.getByRole("button", { name: "下書きを作成" }).click();
  await expect(page).toHaveURL(/\/events\/[0-9a-f-]+/);
  const eventId = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByRole("button", { name: "審査へ提出" }).click();
  await expect(page.getByText("審査へ提出しました。")).toBeVisible();
  await logout(page);

  await login(page, "admin@example.com");
  await page.goto("/admin/events");
  const review = page.getByRole("article").filter({ hasText: eventTitle });
  await review.getByLabel(/審査メモ/).fill("Description needs an update");
  await review.getByRole("button", { name: "変更を依頼" }).click();
  await expect(page.getByText("イベント改訂を差し戻しました。")).toBeVisible();
  await logout(page);

  await login(page, "owner@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/events/${eventId}`);
  await expect(page.getByText("changes_requested")).toBeVisible();
  await page.getByLabel("説明").fill("Updated after Platform Admin feedback");
  await page.getByRole("button", { name: "審査へ提出" }).click();
  await logout(page);

  await login(page, "admin@example.com");
  await page.goto("/admin/events");
  const resubmitted = page.getByRole("article").filter({ hasText: eventTitle });
  await resubmitted.getByRole("button", { name: "承認・公開" }).click();
  await expect(page.getByText("イベント改訂を承認し、公開版を更新しました。")).toBeVisible();
  await logout(page);

  await page.goto(`/events/${eventId}`);
  await expect(page.getByRole("heading", { name: eventTitle })).toBeVisible();
  await expect(page.getByText("Updated after Platform Admin feedback")).toBeVisible();
  await expect(page.getByText("一般前売")).toBeVisible();
  await expect(page.getByText(/3,000/)).toBeVisible();
  await expect(page.getByText("U25")).toBeVisible();

  await login(page, "owner@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/events/${eventId}`);
  await page.getByRole("button", { name: "次のRevisionを作成" }).click();
  await page.getByLabel("説明").fill("Published update is now ready for review");
  await page.locator(".ticket-offer-row").nth(0).getByLabel("金額（最小通貨単位）").fill("3500");
  await page.getByRole("button", { name: "審査へ提出" }).click();
  await logout(page);

  await page.goto(`/events/${eventId}`);
  await expect(page.getByText("Updated after Platform Admin feedback")).toBeVisible();
  await expect(page.getByText("Published update is now ready for review")).toHaveCount(0);
  await expect(page.getByText(/3,000/)).toBeVisible();
  await expect(page.getByText(/3,500/)).toHaveCount(0);

  await login(page, "admin@example.com");
  await page.goto("/admin/events");
  const updateReview = page.getByRole("article").filter({ hasText: eventTitle });
  await updateReview.getByRole("button", { name: "承認・公開" }).click();
  await logout(page);

  await page.goto(`/events/${eventId}`);
  await expect(page.getByText("Published update is now ready for review")).toBeVisible();
  await expect(page.getByText(/3,500/)).toBeVisible();

  await login(page, "owner@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/events/${eventId}`);
  await page.getByLabel("中止理由").fill("Venue closure for M4 E2E");
  await page.getByRole("button", { name: "中止を申請" }).click();
  await expect(page.getByText("中止申請をPlatform Adminの審査へ送りました。")).toBeVisible();
  await logout(page);

  await login(page, "admin@example.com");
  await page.goto("/admin/events");
  const cancellation = page.getByRole("article").filter({ hasText: "Venue closure for M4 E2E" });
  await cancellation.getByLabel(/一般公開する中止理由/).fill("会場都合により中止となりました。");
  await cancellation.getByRole("button", { name: "中止を承認" }).click();
  await expect(page.getByText("イベントの中止を承認し、一般公開ページに反映しました。")).toBeVisible();
  await logout(page);

  await page.goto(`/events/${eventId}`);
  await expect(page.getByRole("status")).toContainText("このEventは中止になりました。");
  await expect(page.getByText("会場都合により中止となりました。")).toBeVisible();
});
