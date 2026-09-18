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

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/events/${eventId}`,
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
