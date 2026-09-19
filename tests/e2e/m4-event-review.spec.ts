import { expect, test, type Page } from "@playwright/test";

const password = "DanceHub123!";
const fixtureOrganizationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const fixtureArtistId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const fixtureVenueId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const eventTitle = "M4 E2E Event";

// A 1x1 PNG. The upload path checks the leading bytes against the declared
// content type, so the fixture has to be a real image rather than a stub.
const pngFixture = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

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
  test.setTimeout(120_000);

  await login(page, "owner@example.com");
  await page.goto(`/workspace/${fixtureOrganizationId}/events`);
  const draft = page.getByRole("heading", { name: "新しいEventを作成" }).locator("..");
  await draft.getByRole("button", { name: "下書きを作成" }).click();
  await expect(draft.getByText("Event名を入力してください。")).toBeVisible();
  await expect(draft.getByLabel("Event名")).toHaveAttribute("aria-invalid", "true");
  await draft.getByLabel("Event名").fill(eventTitle);
  await draft.getByLabel("説明").fill("First reviewable M4 event");
  await draft.locator('select[name="eventType"]').selectOption("performance");
  await draft.getByLabel("Artist（canonical）").selectOption(fixtureArtistId);
  await draft.getByLabel("会場（canonical）").selectOption(fixtureVenueId);
  await draft.getByLabel("開始日時（東京都）").fill("2030-04-01T19:00");
  await draft.getByLabel("終了日時（東京都）").fill("2030-04-01T20:30");
  const offers = draft.getByRole("group", { name: "Ticket Offer（料金）" });
  const addOffer = offers.getByRole("button", { name: "料金を追加" });
  await expect(addOffer).toBeEnabled();
  await addOffer.click();
  await expect(offers.locator(".ticket-offer-row")).toHaveCount(1);
  const advance = offers.locator(".ticket-offer-row").nth(0);
  await advance.getByLabel("ラベル").fill("一般前売");
  await advance.getByLabel("金額（最小通貨単位）").fill("3000");
  await addOffer.click();
  await expect(offers.locator(".ticket-offer-row")).toHaveCount(2);
  const under25 = offers.locator(".ticket-offer-row").nth(1);
  await under25.getByLabel("ラベル").fill("U25");
  await under25.getByLabel("金額（最小通貨単位）").fill("2000");
  // The object key is namespaced by Event id, which does not exist until the
  // draft has been created, so the create form offers no image inputs at all.
  await expect(draft.getByLabel("画像ファイル")).toHaveCount(0);
  await expect(draft.getByLabel("代替テキスト")).toHaveCount(0);
  await draft.getByRole("button", { name: "下書きを作成" }).click();
  await expect(page).toHaveURL(/\/events\/[0-9a-f-]+/);
  const eventId = new URL(page.url()).pathname.split("/").at(-1)!;

  // Alt text is half of an event_media row, so saving it without a file is
  // refused rather than written as a row the database cannot hold.
  await page.getByLabel("代替テキスト").fill("M4 E2E Eventのメイン画像");
  await page.getByRole("button", { name: "下書きを保存" }).click();
  await expect(page.getByText("代替テキストを保存するには画像ファイルを選択してください。")).toBeVisible();

  // A strict resolution here is the guard: the rejection names 代替テキスト, and
  // rendering it inside the 画像ファイル label would put it in that control's
  // accessible name and match two elements. The typed alt text survives the
  // round trip; only the file input, which a browser cannot repopulate, does not.
  await expect(page.getByLabel("代替テキスト")).toHaveValue("M4 E2E Eventのメイン画像");
  await page.getByLabel("画像ファイル").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: pngFixture,
  });
  await page.getByLabel("代替テキスト").fill("M4 E2E Eventのメイン画像");
  await page.getByRole("button", { name: "下書きを保存" }).click();
  // Waiting on the success notice would prove nothing: the edit page shows the
  // same 下書きを保存しました。 for ?created=1, which is still in the URL from
  // draft creation, so it is already on screen. Wait for the redirect instead,
  // or the steps below race the save that is still in flight.
  await expect(page).toHaveURL(/[?&]saved=1/);

  // Nothing of a draft is served: the delivery route resolves the Event's
  // approved Revision, and there is not one yet.
  const draftImage = await page.request.get(`/events/${eventId}/image`);
  expect(draftImage.status()).toBe(404);

  await page.getByLabel("説明").fill("");
  await page.getByRole("button", { name: "審査へ提出" }).click();
  await expect(page.getByText("審査提出には説明が必要です。")).toBeVisible();
  await expect(page.getByLabel("説明")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("説明").fill("First reviewable M4 event");
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
  await page.getByRole("link", { name: /通知/ }).click();
  await expect(page.getByRole("heading", { name: "Event Revisionに変更依頼があります" })).toBeVisible();
  await expect(page.getByText("Description needs an update", { exact: true })).toBeVisible();
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
  // The approved Revision's image is served by the delivery route, which
  // resolves published_revision_id rather than trusting the URL.
  const mainImage = page.getByRole("img", { name: "M4 E2E Eventのメイン画像" });
  await expect(mainImage).toBeVisible();
  await expect(mainImage).toHaveAttribute("src", `/events/${eventId}/image`);
  const imageResponse = await page.request.get(`/events/${eventId}/image`);
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toBe("image/png");

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
  await page.getByRole("link", { name: /通知/ }).click();
  await expect(page.getByRole("heading", { name: "Event Revisionが承認・公開されました" }).first()).toBeVisible();
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

  await login(page, "owner@example.com");
  await page.getByRole("link", { name: /通知/ }).click();
  await expect(page.getByRole("heading", { name: "Eventの中止申請が承認されました" })).toBeVisible();
  await expect(page.getByText("会場都合により中止となりました。", { exact: true })).toBeVisible();
  await logout(page);

  await page.goto(`/events/${eventId}`);
  await expect(page.getByRole("status")).toContainText("このEventは中止になりました。");
  await expect(page.getByText("会場都合により中止となりました。")).toBeVisible();
});
