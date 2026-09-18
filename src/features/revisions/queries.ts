import "server-only";

import type { requireOrganizationCapability } from "@/features/organizations/policy";

type OrganizationContext = Awaited<
  ReturnType<typeof requireOrganizationCapability>
>;

export function getRevisionListData(supabase: OrganizationContext["supabase"]) {
  return Promise.all([
    supabase
      .from("event_revisions")
      .select("id, event_id, title, event_type, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("artists").select("id, name").order("name").limit(100),
    supabase
      .from("venues")
      .select("id, name, prefecture")
      .order("name")
      .limit(100),
  ]);
}

export function getRevisionEditOverview(
  supabase: OrganizationContext["supabase"],
  eventId: string,
) {
  return Promise.all([
    supabase
      .from("event_revisions")
      .select(
        "id, event_id, title, description, event_type, application_deadline, proposed_parent_event_id, no_registration_required, status, created_at",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, published_revision_id, cancelled_at")
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("event_cancellation_requests")
      .select("id, status, requested_reason, decision_reason, updated_at")
      .eq("event_id", eventId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("event_revisions")
      .select("event_id, title")
      .eq("event_type", "festival")
      .in("status", ["draft", "in_review", "changes_requested", "approved"]),
  ]);
}

export function getRevisionContent(
  supabase: OrganizationContext["supabase"],
  revisionId: string,
) {
  return Promise.all([
    supabase.from("artists").select("id, name").order("name").limit(100),
    supabase
      .from("venues")
      .select("id, name, prefecture")
      .order("name")
      .limit(100),
    supabase
      .from("event_artists")
      .select("artist_id, role")
      .eq("event_revision_id", revisionId)
      .order("display_order")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("event_schedules")
      .select("venue_id, starts_at, ends_at, all_day")
      .eq("event_revision_id", revisionId)
      .order("starts_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("event_ticket_offers")
      .select(
        "id, price_type, label, currency, amount_minor, min_amount_minor, max_amount_minor, notes",
      )
      .eq("event_revision_id", revisionId)
      .order("display_order"),
    supabase
      .from("event_ticket_links")
      .select("kind, label, url")
      .eq("event_revision_id", revisionId)
      .order("display_order")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("event_links")
      .select("label, url")
      .eq("event_revision_id", revisionId)
      .order("display_order")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("event_media")
      .select("object_key, content_type, alt_text")
      .eq("event_revision_id", revisionId)
      .eq("is_main", true)
      .maybeSingle(),
  ]);
}
