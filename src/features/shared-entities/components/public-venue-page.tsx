import Link from "next/link";
import { notFound } from "next/navigation";

import { prefectureLabel } from "@/features/discovery/projection";
import { getPublicVenuePageData } from "@/features/shared-entities/queries";

import PublicEventList from "./public-event-list";

export default async function PublicVenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const data = await getPublicVenuePageData(venueId);

  if (!data) notFound();

  const { venue, events } = data;

  return (
    <main className="workspace-main narrow-main">
      <Link className="back-link" href="/">← DANCE HUB</Link>
      <section className="hero-card">
        <div>
          <p className="eyebrow">Venue</p>
          <h1>{venue.name}</h1>
          <p className="lede">
            {prefectureLabel(venue.prefecture)} {venue.address_line1}
            {venue.address_line2 ? ` ${venue.address_line2}` : ""}
          </p>
        </div>
      </section>
      {venue.website_url ? (
        <section className="section-block">
          <h2>Web サイト</h2>
          <div className="button-row">
            <a
              className="button button-quiet"
              href={venue.website_url}
              rel="noreferrer"
              target="_blank"
            >
              {venue.website_url}
            </a>
          </div>
        </section>
      ) : null}
      <section className="section-block">
        <h2>この会場の Event</h2>
        <PublicEventList
          emptyMessage="公開中のEventはまだありません。"
          events={events}
        />
      </section>
    </main>
  );
}
