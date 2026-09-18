import PublicVenuePage from "@/features/shared-entities/components/public-venue-page";

export default function VenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  return <PublicVenuePage params={params} />;
}
