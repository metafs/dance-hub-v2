"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationCapability } from "@/lib/auth/authorization";
import type { Database } from "@/lib/db/database.types";
import { parseTicketOffers } from "@/lib/events/ticket-offers";

type EventType = Database["public"]["Enums"]["event_type"];
type TicketKind = Database["public"]["Enums"]["event_access_link_kind"];

const eventTypes = [
  "performance", "open_studio", "talk", "workshop", "audition", "open_call",
  "residency", "festival", "other",
] as const satisfies readonly EventType[];

function isEventType(value: string): value is EventType {
  return eventTypes.some((eventType) => eventType === value);
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function url(value: string) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

// datetime-local has no offset. M4's product decision is that organizer input
// is Tokyo local time, so persist it as an explicit Asia/Tokyo instant.
function tokyoDateTime(value: string) {
  if (!value) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const parsed = new Date(`${withSeconds}+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function eventPath(organizationId: string, eventId?: string) {
  return eventId
    ? `/workspace/${organizationId}/events/${eventId}`
    : `/workspace/${organizationId}/events`;
}

function invalid(organizationId: string, eventId?: string): never {
  redirect(`${eventPath(organizationId, eventId)}?error=invalid-input`);
}

function content(formData: FormData) {
  const ticketOffers = parseTicketOffers(formData);
  const startsAt = tokyoDateTime(text(formData, "startsAt"));
  const endsAt = tokyoDateTime(text(formData, "endsAt"));
  const objectKey = text(formData, "imageObjectKey");
  const contentType = text(formData, "imageContentType");
  const imageAlt = text(formData, "imageAlt");
  const ticketUrlInput = text(formData, "ticketUrl");
  const externalUrlInput = text(formData, "externalUrl");

  if (!ticketOffers || (startsAt && !text(formData, "venueId")) || (endsAt && !startsAt)) return null;
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) return null;
  if (Boolean(objectKey) !== Boolean(contentType) || Boolean(objectKey) !== Boolean(imageAlt)) return null;
  if (contentType && !contentType.toLowerCase().startsWith("image/")) return null;

  const ticketUrl = url(ticketUrlInput);
  const externalUrl = url(externalUrlInput);
  if ((ticketUrlInput && !ticketUrl) || (externalUrlInput && !externalUrl)) return null;
  const ticketKind: TicketKind = text(formData, "ticketKind") === "registration" ? "registration" : "ticket";

  return {
    artistId: text(formData, "artistId") || null,
    artistRole: text(formData, "artistRole") || "出演",
    venueId: text(formData, "venueId") || null,
    startsAt,
    endsAt,
    allDay: formData.get("allDay") === "on",
    ticketKind,
    ticketUrl,
    ticketLabel: text(formData, "ticketLabel") || null,
    ticketOffers,
    externalUrl,
    externalLabel: text(formData, "externalLabel") || "公式サイト",
    imageObjectKey: objectKey || null,
    imageContentType: contentType || null,
    imageAlt: imageAlt || null,
  };
}

async function replaceRevisionContent(
  supabase: Awaited<ReturnType<typeof requireOrganizationCapability>>["supabase"],
  revisionId: string,
  values: NonNullable<ReturnType<typeof content>>,
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

function revisionFields(formData: FormData) {
  const title = text(formData, "title");
  const eventTypeInput = text(formData, "eventType");
  const deadlineInput = text(formData, "applicationDeadline");
  const applicationDeadline = tokyoDateTime(deadlineInput);
  if (!title || title.length > 200 || (deadlineInput && !applicationDeadline)) return null;
  let eventType: EventType | null = null;
  if (eventTypeInput) {
    if (!isEventType(eventTypeInput)) return null;
    eventType = eventTypeInput;
  }
  return {
    title,
    description: text(formData, "description") || null,
    event_type: eventType || null,
    application_deadline: applicationDeadline,
    proposed_parent_event_id: text(formData, "proposedParentEventId") || null,
    no_registration_required: formData.get("noRegistrationRequired") === "on",
  };
}

export async function createEventDraft(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const fields = revisionFields(formData);
  const values = content(formData);
  if (!organizationId || !fields || !values) invalid(organizationId);
  const { supabase, user } = await requireOrganizationCapability(organizationId, "editEvents");
  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({ owner_organization_id: organizationId })
    .select("id")
    .single();
  if (eventError || !event) redirect(`${eventPath(organizationId)}?error=create-failed`);
  const { data: revision, error: revisionError } = await supabase
    .from("event_revisions")
    .insert({ event_id: event.id, created_by: user.id, ...fields })
    .select("id")
    .single();
  if (revisionError || !revision) redirect(`${eventPath(organizationId)}?error=create-failed`);
  const contentError = await replaceRevisionContent(supabase, revision.id, values);
  if (contentError) redirect(`${eventPath(organizationId, event.id)}?error=content-save`);
  revalidatePath(eventPath(organizationId));
  redirect(`${eventPath(organizationId, event.id)}?created=1`);
}

async function saveEvent(formData: FormData, submit: boolean) {
  const organizationId = text(formData, "organizationId");
  const eventId = text(formData, "eventId");
  const revisionId = text(formData, "revisionId");
  const fields = revisionFields(formData);
  const values = content(formData);
  if (!organizationId || !eventId || !revisionId || !fields || !values) invalid(organizationId, eventId);
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");

  // RLS scopes the revision to the current Organization and only permits the
  // mutable columns while its state is draft or changes_requested.
  const { error: revisionError } = await supabase
    .from("event_revisions")
    .update(fields)
    .eq("id", revisionId)
    .eq("event_id", eventId);
  if (revisionError) redirect(`${eventPath(organizationId, eventId)}?error=save-failed`);
  const contentError = await replaceRevisionContent(supabase, revisionId, values);
  if (contentError) redirect(`${eventPath(organizationId, eventId)}?error=content-save`);
  if (submit) {
    const { error } = await supabase.rpc("submit_event_revision", { target_revision_id: revisionId });
    if (error) redirect(`${eventPath(organizationId, eventId)}?error=not-ready`);
  }
  revalidatePath(eventPath(organizationId));
  redirect(`${eventPath(organizationId, eventId)}?${submit ? "submitted=1" : "saved=1"}`);
}

export async function saveEventDraft(formData: FormData) {
  return saveEvent(formData, false);
}

export async function submitEventDraft(formData: FormData) {
  return saveEvent(formData, true);
}

export async function createNextEventRevisionDraft(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const eventId = text(formData, "eventId");
  if (!organizationId || !eventId) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const { data: revisionId, error } = await supabase.rpc("create_event_revision_draft", {
    target_event_id: eventId,
  });
  if (error || !revisionId) redirect(`${eventPath(organizationId, eventId)}?error=revision-create`);
  revalidatePath(eventPath(organizationId, eventId));
  redirect(`${eventPath(organizationId, eventId)}?revision=${revisionId}&created=1`);
}

export async function requestEventCancellation(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const eventId = text(formData, "eventId");
  const reason = text(formData, "reason");
  if (!organizationId || !eventId || !reason || reason.length > 2000) {
    invalid(organizationId, eventId);
  }
  const { supabase } = await requireOrganizationCapability(organizationId, "requestCancellation");
  const { error } = await supabase.rpc("request_event_cancellation", {
    target_event_id: eventId,
    requested_reason: reason,
  });
  if (error) redirect(`${eventPath(organizationId, eventId)}?error=cancellation-request`);
  revalidatePath(eventPath(organizationId, eventId));
  redirect(`${eventPath(organizationId, eventId)}?cancellation=requested`);
}

export async function resubmitEventCancellation(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const eventId = text(formData, "eventId");
  const requestId = text(formData, "requestId");
  const reason = text(formData, "reason");
  if (!organizationId || !eventId || !requestId || !reason || reason.length > 2000) {
    invalid(organizationId, eventId);
  }
  const { supabase } = await requireOrganizationCapability(organizationId, "requestCancellation");
  const { error } = await supabase.rpc("resubmit_event_cancellation_request", {
    target_request_id: requestId,
    requested_reason: reason,
  });
  if (error) redirect(`${eventPath(organizationId, eventId)}?error=cancellation-resubmit`);
  revalidatePath(eventPath(organizationId, eventId));
  redirect(`${eventPath(organizationId, eventId)}?cancellation=resubmitted`);
}
