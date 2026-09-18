import PublicEventPage from "@/features/events/components/public-event-page";

export default function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return <PublicEventPage params={params} />;
}
