import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicArtistPageData } from "@/features/shared-entities/queries";

import PublicEventList from "./public-event-list";

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
    <main className="workspace-main narrow-main">
      <Link className="back-link" href="/">← DANCE HUB</Link>
      <section className="hero-card">
        <div>
          <p className="eyebrow">Artist</p>
          <h1>{artist.name}</h1>
          {artist.profile ? <p className="lede">{artist.profile}</p> : null}
        </div>
      </section>
      {artist.website_url ? (
        <section className="section-block">
          <h2>Web サイト</h2>
          <div className="button-row">
            <a
              className="button button-quiet"
              href={artist.website_url}
              rel="noreferrer"
              target="_blank"
            >
              {artist.website_url}
            </a>
          </div>
        </section>
      ) : null}
      <section className="section-block">
        <h2>関連 Event</h2>
        <PublicEventList
          emptyMessage="公開中のEventはまだありません。"
          events={events}
          roleByRevision={roleByRevision}
        />
      </section>
    </main>
  );
}
