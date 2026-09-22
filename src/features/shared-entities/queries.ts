import "server-only";

import { listPublicEventsForRevisions } from "@/features/discovery/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { requireOrganizationCapability } from "@/features/organizations/policy";

type OrganizationContext = Awaited<
  ReturnType<typeof requireOrganizationCapability>
>;

export function getEntityWorkspaceData(
  supabase: OrganizationContext["supabase"],
  organizationId: string,
) {
  return Promise.all([
    supabase
      .from("artists")
      .select("id, name, artist_type, website_url")
      .order("name")
      .limit(30),
    supabase
      .from("venues")
      .select("id, name, prefecture, address_line1")
      .order("name")
      .limit(30),
    supabase
      .from("artist_candidates")
      .select("id, name, artist_type, status, decision_reason")
      .eq("creator_organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("venue_candidates")
      .select("id, name, prefecture, status, decision_reason")
      .eq("creator_organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);
}

export function getPendingArtistCandidate(
  supabase: OrganizationContext["supabase"],
  organizationId: string,
  candidateId: string,
) {
  return supabase
    .from("artist_candidates")
    .select("id, name, artist_type, profile, website_url, status")
    .eq("id", candidateId)
    .eq("creator_organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();
}

export function getPendingVenueCandidate(
  supabase: OrganizationContext["supabase"],
  organizationId: string,
  candidateId: string,
) {
  return supabase
    .from("venue_candidates")
    .select(
      "id, name, prefecture, address_line1, address_line2, website_url, status",
    )
    .eq("id", candidateId)
    .eq("creator_organization_id", organizationId)
    .eq("status", "pending")
    .maybeSingle();
}

/**
 * Just enough of an Artist for page metadata. The full page query also loads
 * every credited Event, which a <head> does not need and which would double
 * the work for each request.
 */
export async function getPublicArtistMetadata(artistId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("artists")
    .select("name, profile")
    .eq("id", artistId)
    .maybeSingle();

  return data;
}

/** The Venue equivalent of getPublicArtistMetadata. */
export async function getPublicVenueMetadata(venueId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("venues")
    .select("name, prefecture, address_line1")
    .eq("id", venueId)
    .maybeSingle();

  return data;
}

/**
 * Public Artist detail: the canonical record plus the approved Events it is
 * credited in (REQ-ARTIST-001, REQ-ARTIST-002). RLS limits event_artists to
 * the current published Revision, so an unapproved credit contributes nothing.
 */
export async function getPublicArtistPageData(artistId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, artist_type, profile, website_url")
    .eq("id", artistId)
    .maybeSingle();

  if (!artist) return null;

  const { data: credits } = await supabase
    .from("event_artists")
    .select("event_revision_id, role")
    .eq("artist_id", artistId);

  const roleByRevision = new Map(
    (credits ?? []).map((credit) => [credit.event_revision_id, credit.role]),
  );
  const events = await listPublicEventsForRevisions([...roleByRevision.keys()]);

  return { artist, events, roleByRevision };
}

/**
 * Public Venue detail: the canonical record plus the approved Events scheduled
 * there (REQ-VENUE-001). The Event relationship is expressed through Schedules
 * rather than a Venue column, so the Schedules are what is looked up.
 */
export async function getPublicVenuePageData(venueId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, prefecture, address_line1, address_line2, website_url")
    .eq("id", venueId)
    .maybeSingle();

  if (!venue) return null;

  const { data: schedules } = await supabase
    .from("event_schedules")
    .select("event_revision_id")
    .eq("venue_id", venueId);

  const revisionIds = [
    ...new Set((schedules ?? []).map((schedule) => schedule.event_revision_id)),
  ];

  return { venue, events: await listPublicEventsForRevisions(revisionIds) };
}
