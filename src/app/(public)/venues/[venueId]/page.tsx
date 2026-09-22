import type { Metadata } from "next";

import { prefectureLabel, type Prefecture } from "@/features/discovery/projection";
import PublicVenuePage from "@/features/shared-entities/components/public-venue-page";
import { getPublicVenueMetadata } from "@/features/shared-entities/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueId: string }>;
}): Promise<Metadata> {
  const { venueId } = await params;
  const venue = await getPublicVenueMetadata(venueId);

  if (!venue) return {};

  const region = prefectureLabel(venue.prefecture as Prefecture);
  const description = `${region}${venue.address_line1 ? ` ${venue.address_line1}` : ""}。この会場で開催されるEventの一覧です。`;

  return {
    title: venue.name,
    description,
    openGraph: {
      type: "website",
      title: venue.name,
      description,
      url: `/venues/${venueId}`,
    },
  };
}

export default function VenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  return <PublicVenuePage params={params} />;
}
