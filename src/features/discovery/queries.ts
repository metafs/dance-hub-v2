import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  calendarDays,
  matchesFilters,
  openApplications,
  projectEvents,
  sortByDiscoveryOrder,
  type ArtistCreditRow,
  type DiscoveryEventSummary,
  type DiscoveryFilters,
  type EventRow,
  type RevisionRow,
  type ScheduleRow,
  type VenueRow,
} from "./projection";

/**
 * Loads every Event a Visitor may see, as its approved-Revision projection.
 *
 * RLS already limits each of these tables to the current published Revision,
 * so this reads what a Visitor is allowed to read rather than filtering for
 * visibility here. The reads are separate `in` lookups rather than embedded
 * joins because `events` and `event_revisions` reference each other, which
 * makes an embedded join ambiguous; the number of round trips is fixed
 * regardless of how many Events match.
 */
type PublicEventScope = {
  revisionIds?: readonly string[];
  eventIds?: readonly string[];
  parentEventId?: string;
};

async function loadPublicEvents(
  scope: PublicEventScope = {},
): Promise<DiscoveryEventSummary[]> {
  if (scope.revisionIds?.length === 0 || scope.eventIds?.length === 0) return [];

  const supabase = await createSupabaseServerClient();

  let eventQuery = supabase
    .from("events")
    .select("id, published_revision_id, cancelled_at, parent_event_id, owner_organization_id")
    .not("published_revision_id", "is", null);

  if (scope.revisionIds) {
    eventQuery = eventQuery.in("published_revision_id", scope.revisionIds);
  }
  if (scope.eventIds) eventQuery = eventQuery.in("id", scope.eventIds);
  if (scope.parentEventId) {
    eventQuery = eventQuery.eq("parent_event_id", scope.parentEventId);
  }

  const { data: events } = await eventQuery;

  if (!events?.length) return [];

  const revisionIds = events
    .map((event) => event.published_revision_id)
    .filter((id): id is string => Boolean(id));

  // Artist credits come along because REQ-DISCOVERY-003 searches Artist names
  // and ADR-0020 matches over this projection rather than in SQL.
  const [{ data: revisions }, { data: schedules }, { data: artistCredits }] = await Promise.all([
    supabase
      .from("event_revisions")
      .select("id, title, description, event_type, application_deadline")
      .in("id", revisionIds),
    supabase
      .from("event_schedules")
      .select("event_revision_id, starts_at, ends_at, all_day, venue_id")
      .in("event_revision_id", revisionIds)
      .order("starts_at"),
    supabase
      .from("event_artists")
      .select("event_revision_id, artist_id")
      .in("event_revision_id", revisionIds),
  ]);

  const venueIds = [...new Set((schedules ?? []).map((schedule) => schedule.venue_id))];
  const organizationIds = [
    ...new Set(events.map((event) => event.owner_organization_id)),
  ];
  const artistIds = [
    ...new Set((artistCredits ?? []).map((credit) => credit.artist_id)),
  ];

  const [{ data: venues }, { data: organizations }, { data: artists }] = await Promise.all([
    venueIds.length
      ? supabase.from("venues").select("id, name, prefecture").in("id", venueIds)
      : Promise.resolve({ data: [] as VenueRow[] }),
    organizationIds.length
      ? supabase.from("organizations").select("id, name").in("id", organizationIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    artistIds.length
      ? supabase.from("artists").select("id, name").in("id", artistIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  return projectEvents({
    events: (events ?? []) as EventRow[],
    revisions: (revisions ?? []) as RevisionRow[],
    schedules: (schedules ?? []) as ScheduleRow[],
    venues: (venues ?? []) as VenueRow[],
    organizations: organizations ?? [],
    artistCredits: (artistCredits ?? []) as ArtistCreditRow[],
    artists: artists ?? [],
  });
}

/**
 * The Event list. Festival child Events stay listed in their own right; the
 * Festival shows the date range derived from them (ADR-0009).
 */
export async function listPublicEvents(filters: DiscoveryFilters = {}) {
  const events = await loadPublicEvents();

  return sortByDiscoveryOrder(
    events.filter((event) => matchesFilters(event, filters)),
  );
}

/**
 * The Events published from the given Revisions, for the Artist and Venue
 * detail pages. RLS still decides what is readable, so a Revision that is not
 * the current approved one contributes nothing.
 */
export async function listPublicEventsForRevisions(revisionIds: readonly string[]) {
  return sortByDiscoveryOrder(await loadPublicEvents({ revisionIds }));
}

/**
 * The published child Events of a Festival, in date order. A Festival is one
 * level deep and its children belong to the same Organization (ADR-0009), so
 * this needs no recursion.
 */
export async function listFestivalChildEvents(parentEventId: string) {
  return sortByDiscoveryOrder(await loadPublicEvents({ parentEventId }));
}

/** One Event's public summary, for linking a child Event back to its Festival. */
export async function getPublicEventSummary(eventId: string) {
  const [summary] = await loadPublicEvents({ eventIds: [eventId] });
  return summary ?? null;
}

/** `apply` Events ordered by application deadline (REQ-DISCOVERY-003). */
export async function listOpenApplications() {
  return openApplications(await loadPublicEvents());
}

/**
 * Calendar entries by Tokyo calendar day. Application deadlines are excluded
 * by construction: only Schedules place an Event on a day (REQ-DISCOVERY-001).
 */
export async function listCalendarDays(filters: DiscoveryFilters = {}) {
  const events = await loadPublicEvents();

  return calendarDays(events.filter((event) => matchesFilters(event, filters)));
}
