import "server-only";

import type { requirePlatformAdmin } from "@/features/moderation/policy";

type ModerationContext = Awaited<ReturnType<typeof requirePlatformAdmin>>;

export function getApplicationReviewQueue(
  supabase: ModerationContext["supabase"],
) {
  return supabase
    .from("organization_applications")
    .select("id, applicant_id, name, website_url, status, created_at")
    .eq("status", "submitted")
    .order("created_at");
}

export function getEntityReviewData(supabase: ModerationContext["supabase"]) {
  return Promise.all([
    supabase.from("artists").select("id, name").order("name"),
    supabase.from("venues").select("id, name").order("name"),
    supabase
      .from("artist_candidates")
      .select("id, name, artist_type, creator_organization_id")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("venue_candidates")
      .select("id, name, prefecture, address_line1, creator_organization_id")
      .eq("status", "pending")
      .order("created_at"),
  ]);
}

export function getEventReviewQueue(supabase: ModerationContext["supabase"]) {
  return Promise.all([
    supabase
      .from("event_revisions")
      .select(
        "id, event_id, title, description, event_type, application_deadline, created_at, events!event_revisions_event_id_fkey!inner(owner_organization_id, organizations(name))",
      )
      .eq("status", "in_review")
      .order("created_at"),
    supabase
      .from("event_cancellation_requests")
      .select(
        "id, event_id, requested_reason, created_at, events!event_cancellation_requests_event_id_fkey!inner(owner_organization_id, organizations(name))",
      )
      .eq("status", "in_review")
      .order("created_at"),
  ]);
}

export function getReviewTicketOffers(
  supabase: ModerationContext["supabase"],
  revisionIds: string[],
) {
  return revisionIds.length
    ? supabase
      .from("event_ticket_offers")
      .select(
        "event_revision_id, price_type, label, currency, amount_minor, min_amount_minor, max_amount_minor, notes, display_order",
      )
      .in("event_revision_id", revisionIds)
      .order("display_order")
    : Promise.resolve({ data: [], error: null });
}
