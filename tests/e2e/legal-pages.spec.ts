import { expect, test } from "@playwright/test";

// M7: the terms, the privacy policy and the operator page are linked from every
// public page. Until their wording is settled with legal advice they say they
// are in preparation and stay out of search results.

const documents = [
  { link: "利用規約", path: "/terms", heading: "利用規約", section: "掲載の審査" },
  { link: "プライバシーポリシー", path: "/privacy", heading: "プライバシーポリシー", section: "取得する情報" },
  { link: "運営者情報", path: "/operator", heading: "運営者情報", section: "お問い合わせ" },
];

for (const document of documents) {
  test(`${document.heading} is reachable from the footer`, async ({ page }) => {
    await page.goto("/events");
    await page.getByRole("contentinfo").getByRole("link", { name: document.link }).click();

    await expect(page).toHaveURL(new RegExp(`${document.path}$`));
    await expect(page.getByRole("heading", { name: document.heading, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: document.section, level: 2 })).toBeVisible();
    await expect(page.getByText("この文書は準備中です。")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("the operator page points to the request form it promises", async ({ page }) => {
  await page.goto("/operator");
  await page.getByRole("main").getByRole("link", { name: "掲載の削除・修正を依頼する" }).click();
  await expect(page).toHaveURL(/\/listing-requests$/);
});

// Nine footer links once squeezed the brand column to a few pixels, and its
// description ran into the links.
test("the footer keeps its brand line intact at desktop widths", async ({ page }) => {
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/events");
    const brand = page.getByRole("contentinfo").getByText("東京都・神奈川県のダンスとパフォーマンスを探す");
    const box = await brand.boundingBox();
    expect(box?.height, `brand line at ${width}px`).toBeLessThan(30);
  }
});
