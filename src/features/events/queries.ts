import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublicEventPageData(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, published_revision_id, cancelled_at, cancellation_reason")
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
        "title, description, event_type, application_deadline, no_registration_required",
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

  return {
    data: {
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
