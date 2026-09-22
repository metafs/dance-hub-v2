import { notFound } from "next/navigation";

import { artistTypeLabel } from "@/features/shared-entities/schema";
import { getPublicArtistPageData } from "@/features/shared-entities/queries";

import { EntityEventSections } from "./entity-event-sections";

export default async function PublicArtistPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const data = await getPublicArtistPageData(artistId);

  if (!data) notFound();

  const { artist, events, roleByRevision } = data;

  return (
    <div className="container entity-layout">
      <div className="entity-profile">
        <p className="page-meta"><span>出演者</span><span>{artistTypeLabel(artist.artist_type)}</span></p>
        <h1>{artist.name}</h1>
        {artist.profile ? <p className="prose">{artist.profile}</p> : null}
        {artist.website_url ? (
          <a className="text-link" href={artist.website_url} rel="noreferrer" target="_blank">
            ウェブサイト
          </a>
        ) : null}
        <dl className="entity-facts">
          <dt>掲載されている上演</dt>
          <dd>{events.length}件</dd>
        </dl>
      </div>

      <div className="entity-events">
        <EntityEventSections
          detailFor={(event) => roleByRevision.get(event.publishedRevisionId) ?? null}
          events={events}
          idPrefix="artist"
          showVenue
        />
      </div>
    </div>
  );
}
