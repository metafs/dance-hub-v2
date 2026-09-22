import { notFound } from "next/navigation";

import { prefectureName } from "@/features/shared-entities/schema";
import { getPublicVenuePageData } from "@/features/shared-entities/queries";

import { EntityEventSections } from "./entity-event-sections";

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
    <div className="container entity-layout">
      <div className="entity-profile">
        <p className="page-meta"><span>会場</span></p>
        <h1>{venue.name}</h1>
        <p>
          {prefectureName(venue.prefecture)} {venue.address_line1}
          {venue.address_line2 ? ` ${venue.address_line2}` : ""}
        </p>
        {venue.website_url ? (
          <a className="text-link" href={venue.website_url} rel="noreferrer" target="_blank">
            ウェブサイト
          </a>
        ) : null}
        <dl className="entity-facts">
          <dt>掲載されている上演</dt>
          <dd>{events.length}件</dd>
        </dl>
      </div>

      <div className="entity-events">
        {/* Every row is at this Venue, so the rows leave the venue out. */}
        <EntityEventSections events={events} idPrefix="venue" showVenue={false} />
      </div>
    </div>
  );
}
