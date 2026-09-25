import { expect, test } from "@playwright/test";

// Every response the application renders carries the headers next.config.ts
// sets (docs/architecture/security.md): pages, the sign-in form, route handlers
// and 404s alike.

const paths = [
  "/",
  "/login",
  "/events/e0000001-0000-4000-8000-000000000001",
  "/events/e0000001-0000-4000-8000-000000000001/image",
  "/sitemap.xml",
  "/no-such-page",
];

for (const path of paths) {
  test(`security headers on ${path}`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    const headers = response.headers();

    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toMatch(/^max-age=\d+/);
  });
}
