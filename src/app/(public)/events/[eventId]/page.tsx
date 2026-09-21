import type { Metadata } from "next";

import PublicEventPage from "@/features/events/components/public-event-page";
import { getPublicEventMetadata } from "@/features/events/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getPublicEventMetadata(eventId);

  if (!event) return {};

  const title = event.cancelledAt ? `${event.title}（中止）` : event.title;
  const description = event.description ?? undefined;

  // A link shared on a social platform or in a chat carries the Event's own
  // image when it has one. The URL is the same delivery route the page uses,
  // so a withdrawn or superseded Revision stops serving it at the same moment.
  const images = event.mainImageAlt
    ? [{ url: `/events/${eventId}/image`, alt: event.mainImageAlt }]
    : [{ url: "/opengraph-image", alt: "p8ce" }];

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/events/${eventId}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <PublicEventPage params={params} />;
}
