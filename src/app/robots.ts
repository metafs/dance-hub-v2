import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

/**
 * Only the public discovery surface is crawlable. The Organizer workspace, the
 * Platform Admin queues, and the login route hold non-public review data, and
 * the account pages (password reset, the email-link landing) have nothing to
 * index, so they are disallowed here in addition to being protected by
 * server-side authorization and RLS.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/workspace", "/login", "/account", "/password", "/auth"],
    },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
