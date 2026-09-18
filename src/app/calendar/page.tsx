import type { Metadata } from "next";

import CalendarPage from "@/features/discovery/components/calendar-page";

export const metadata: Metadata = {
  title: "Calendar",
  description: "東京都・神奈川県のダンスEventを開催日から探せます。",
};

export default function Calendar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CalendarPage searchParams={searchParams} />;
}
