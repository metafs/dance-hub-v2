import PublicArtistPage from "@/features/shared-entities/components/public-artist-page";

export default function ArtistPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  return <PublicArtistPage params={params} />;
}
