import type { Metadata } from "next";

import PublicArtistPage from "@/features/shared-entities/components/public-artist-page";
import { getPublicArtistMetadata } from "@/features/shared-entities/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistId: string }>;
}): Promise<Metadata> {
  const { artistId } = await params;
  const artist = await getPublicArtistMetadata(artistId);

  // An empty object leaves the layout defaults in place, which is the right
  // answer for an id that resolves to nothing.
  if (!artist) return {};

  const description = artist.profile ?? `${artist.name}が出演するEventの一覧です。`;

  return {
    title: artist.name,
    description,
    openGraph: {
      type: "profile",
      title: artist.name,
      description,
      url: `/artists/${artistId}`,
    },
  };
}

export default function ArtistPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  return <PublicArtistPage params={params} />;
}
