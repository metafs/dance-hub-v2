import type { Metadata } from "next";

import EventListPage from "@/features/discovery/components/event-list-page";

export const metadata: Metadata = {
  title: "Event",
  description: "東京都・神奈川県のダンスEventを日付、地域、種別で探せます。",
};

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <EventListPage searchParams={searchParams} />;
}
