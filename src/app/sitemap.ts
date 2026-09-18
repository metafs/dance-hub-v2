import type { MetadataRoute } from "next";

import { listPublicEventSitemapEntries } from "@/features/events/queries";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Sitemap entries must be absolute, so an unset NEXT_PUBLIC_SITE_URL produces
 * an empty sitemap rather than URLs built on a guessed host. A deployment that
 * wants to be indexed sets the variable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  if (!origin) return [];

  const events = await listPublicEventSitemapEntries();

  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    ...events.map((event) => ({
      url: `${origin}/events/${event.id}`,
      ...(event.lastModified ? { lastModified: new Date(event.lastModified) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
