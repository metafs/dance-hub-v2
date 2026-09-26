import { expect, test } from "@playwright/test";

// The favicon and app icon are the logotype on white (docs/brand/identity.md),
// not the scaffold's default.

test("pages link the p8ce icons, and each one is served", async ({ page, request }) => {
  await page.goto("/");
  const svg = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute("href");
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect(svg).toMatch(/^\/icon\.svg/);
  expect(apple).toMatch(/^\/apple-icon\.png/);

  for (const [path, type] of [[svg!, "image/svg+xml"], [apple!, "image/png"], ["/favicon.ico", "image/x-icon"]] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain(type);
  }
});
