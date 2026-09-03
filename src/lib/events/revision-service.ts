import "server-only";

import type { requireOrganizationCapability } from "@/lib/auth/authorization";

import type { EventRevisionInput } from "./revision-input";

type SupabaseClient = Awaited<ReturnType<typeof requireOrganizationCapability>>["supabase"];

export async function replaceEventRevisionContent(
  supabase: SupabaseClient,
  revisionId: string,
  values: EventRevisionInput["content"],
) {
  const tables = ["event_artists", "event_schedules", "event_ticket_offers", "event_ticket_links", "event_links", "event_media"] as const;
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("event_revision_id", revisionId);
    if (error) return error;
  }

  if (values.artistId) {
    const { error } = await supabase.from("event_artists").insert({
      event_revision_id: revisionId, artist_id: values.artistId, role: values.artistRole, display_order: 0,
    });
    if (error) return error;
  }
  if (values.venueId && values.startsAt) {
    const { error } = await supabase.from("event_schedules").insert({
      event_revision_id: revisionId, venue_id: values.venueId, starts_at: values.startsAt,
      ends_at: values.endsAt, all_day: values.allDay,
    });
    if (error) return error;
  }
  if (values.ticketUrl) {
    const { error } = await supabase.from("event_ticket_links").insert({
      event_revision_id: revisionId, kind: values.ticketKind, label: values.ticketLabel,
      url: values.ticketUrl, display_order: 0,
    });
    if (error) return error;
  }
  if (values.ticketOffers.length) {
    const { error } = await supabase.from("event_ticket_offers").insert(
      values.ticketOffers.map((offer) => ({ event_revision_id: revisionId, ...offer })),
    );
    if (error) return error;
  }
  if (values.externalUrl) {
    const { error } = await supabase.from("event_links").insert({
      event_revision_id: revisionId, label: values.externalLabel, url: values.externalUrl, display_order: 0,
    });
    if (error) return error;
  }
  if (values.imageObjectKey && values.imageContentType && values.imageAlt) {
    const { error } = await supabase.from("event_media").insert({
      event_revision_id: revisionId, object_key: values.imageObjectKey,
      content_type: values.imageContentType, alt_text: values.imageAlt, is_main: true, display_order: 0,
    });
    if (error) return error;
  }
  return null;
}
