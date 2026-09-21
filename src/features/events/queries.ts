import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Title and description of an Event's approved Revision, for page metadata.
 * Returns null when the Event has no approved Revision; RLS already limits
 * anonymous reads to the current published Revision.
 */
export async function getPublicEventMetadata(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("published_revision_id, cancelled_at")
    .eq("id", eventId)
    .maybeSingle();

  if (!event?.published_revision_id) return null;

  const { data: revision } = await supabase
    .from("event_revisions")
    .select("title, description")
    .eq("id", event.published_revision_id)
    .maybeSingle();

  if (!revision) return null;

  // Whether a main image exists decides whether the Open Graph card carries
  // one. Only its presence is needed: the image itself is served by
  // /events/{id}/image, which resolves the approved Revision again (ADR-0016).
  const { data: media } = await supabase
    .from("event_media")
    .select("alt_text")
    .eq("event_revision_id", event.published_revision_id)
    .eq("is_main", true)
    .maybeSingle();

  return {
    ...revision,
    cancelledAt: event.cancelled_at,
    mainImageAlt: media?.alt_text ?? null,
  };
}

/**
 * Every Event a Visitor can open, for the sitemap. Past and cancelled Events
 * stay listed because REQ-EVENT-007 keeps them public.
 */
export async function listPublicEventSitemapEntries() {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, published_revision_id")
    .not("published_revision_id", "is", null);

  if (!events?.length) return [];

  const revisionIds = events
    .map((event) => event.published_revision_id)
    .filter((id): id is string => Boolean(id));
  const { data: revisions } = await supabase
    .from("event_revisions")
    .select("id, reviewed_at")
    .in("id", revisionIds);

  const reviewedAt = new Map(
    (revisions ?? []).map((revision) => [revision.id, revision.reviewed_at]),
  );

  return events.map((event) => ({
    id: event.id,
    lastModified: event.published_revision_id
      ? reviewedAt.get(event.published_revision_id) ?? null
      : null,
  }));
}

/**
 * The stored object behind an Event's public main image, or null when the Event
 * has no approved Revision or that Revision has no main image. RLS already
 * limits event_media to the current published Revision, so an unapproved image
 * cannot be resolved here even by object key (ADR-0016).
 */
export async function getPublishedMainImage(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("published_revision_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event?.published_revision_id) return null;

  const { data: media } = await supabase
    .from("event_media")
    .select("object_key, content_type")
    .eq("event_revision_id", event.published_revision_id)
    .eq("is_main", true)
    .maybeSingle();

  return media
    ? { objectKey: media.object_key, contentType: media.content_type }
    : null;
}

export async function getPublicEventPageData(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, published_revision_id, cancelled_at, cancellation_reason, parent_event_id, owner_organization_id, listing_origin")
    .eq("id", eventId)
    .maybeSingle();

  if (!event?.published_revision_id) {
    return { data: null, event };
  }

  const [
    { data: revision },
    { data: schedules },
    { data: credits },
    { data: ticketOffers },
    { data: accessLinks },
    { data: links },
    { data: media },
  ] = await Promise.all([
    supabase
      .from("event_revisions")
      .select(
        "title, description, event_type, application_deadline, no_registration_required, contact_kind, contact_value",
      )
      .eq("id", event.published_revision_id)
      .maybeSingle(),
    supabase
      .from("event_schedules")
      .select("starts_at, ends_at, all_day, venues(name, prefecture)")
      .eq("event_revision_id", event.published_revision_id)
      .order("starts_at"),
    supabase
      .from("event_artists")
      .select("role, display_order, artists(name)")
      .eq("event_revision_id", event.published_revision_id)
      .order("display_order"),
    supabase
      .from("event_ticket_offers")
      .select(
        "price_type, label, currency, amount_minor, min_amount_minor, max_amount_minor, notes, display_order",
      )
      .eq("event_revision_id", event.published_revision_id)
      .order("display_order"),
    supabase
      .from("event_ticket_links")
      .select("kind, label, url, display_order")
      .eq("event_revision_id", event.published_revision_id)
      .order("display_order"),
    supabase
      .from("event_links")
      .select("label, url, display_order")
      .eq("event_revision_id", event.published_revision_id)
      .order("display_order"),
    supabase
      .from("event_media")
      .select("object_key, alt_text")
      .eq("event_revision_id", event.published_revision_id)
      .eq("is_main", true)
      .maybeSingle(),
  ]);

  // The publishing-Organizations policy exposes the name of an Organization
  // that owns a published Event; it is null when that policy does not admit it.
  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", event.owner_organization_id)
    .maybeSingle();

  return {
    data: {
      organization,
      accessLinks,
      credits,
      links,
      media,
      revision,
      schedules,
      ticketOffers,
    },
    event,
  };
}
