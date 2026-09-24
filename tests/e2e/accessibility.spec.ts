import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// DH-13: the critical journeys meet WCAG 2.2 AA as far as axe can tell, stay
// usable by keyboard, and reflow at 320 CSS px. Rules the design follows are
// in docs/design/ui.md (アクセシビリティ).

const password = "DanceHub123!";
const organizationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const multiVenueId = "e0000001-0000-4000-8000-000000000001";

const publicPages = [
  "/",
  "/events",
  "/events?prefecture=TOKYO&type=performance",
  "/calendar",
  "/calendar?month=2030-05",
  "/open-calls",
  `/events/${multiVenueId}`,
  "/events/e0000003-0000-4000-8000-000000000003",
  "/events/e0000006-0000-4000-8000-000000000006",
  "/artists/cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "/venues/dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "/listing-policy",
  "/listing-requests?kind=withdrawal",
  "/login",
  "/login?error=invalid-credentials",
  "/events/00000000-0000-4000-8000-000000000000",
];

const organizerPages = [
  "/workspace",
  `/workspace/${organizationId}`,
  `/workspace/${organizationId}/events`,
  `/workspace/${organizationId}/events/new`,
  `/workspace/${organizationId}/events/${multiVenueId}`,
  `/workspace/${organizationId}/entities`,
  `/workspace/${organizationId}/settings`,
  "/workspace/notifications",
];

const adminPages = ["/admin/applications", "/admin/entities", "/admin/events", "/admin/withdrawals"];

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    // The Next.js development indicator is not part of the product.
    .exclude("nextjs-portal")
    .analyze();
  const summary = violations.map((violation) =>
    `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  expect(summary, `axe violations on ${path}`).toEqual([]);
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/workspace/);
}

for (const [name, width] of [["desktop", 1280], ["mobile", 390]] as const) {
  test.describe(`${name} (${width}px)`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("public pages have no axe violations", async ({ page }) => {
      test.setTimeout(180_000);
      for (const path of publicPages) await expectNoViolations(page, path);
    });

    test("organizer pages have no axe violations", async ({ page }) => {
      test.setTimeout(180_000);
      await login(page, "owner@example.com");
      for (const path of organizerPages) await expectNoViolations(page, path);
    });

    test("admin pages have no axe violations", async ({ page }) => {
      test.setTimeout(180_000);
      await login(page, "admin@example.com");
      for (const path of adminPages) await expectNoViolations(page, path);
    });
  });
}

test.describe("320px reflow", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  test("pages do not scroll sideways outside a table frame", async ({ page }) => {
    test.setTimeout(180_000);
    const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

    for (const path of publicPages) {
      await page.goto(path);
      expect(await overflow(), `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
    await login(page, "owner@example.com");
    for (const path of organizerPages) {
      await page.goto(path);
      expect(await overflow(), `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });
});

test("keyboard focus is visible and returns to the first error", async ({ page }) => {
  // A focused control draws the outline docs/design/ui.md specifies.
  await page.goto("/events");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement as Element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(outline.style).not.toBe("none");
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);

  // A wide table's frame can be reached and scrolled by keyboard.
  await login(page, "owner@example.com");
  await page.goto(`/workspace/${organizationId}/entities`);
  const frame = page.getByRole("region", { name: "登録済みの出演者", exact: true });
  await frame.focus();
  await expect(frame).toBeFocused();

  // After a submission comes back with errors, focus lands on the first
  // invalid field, which names its error.
  await page.goto(`/workspace/${organizationId}/events/new`);
  await page.getByRole("button", { name: "下書きを作成" }).click();
  const title = page.getByLabel("Event名");
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(title).toHaveAccessibleDescription("Event名を入力してください。");
});
