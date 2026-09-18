"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/authorization";

type ReviewValues = {
  eventId: string;
  targetId: string;
  reason: string;
};

function reviewValues(formData: FormData): ReviewValues {
  return {
    eventId: String(formData.get("eventId") ?? ""),
    targetId: String(formData.get("targetId") ?? ""),
    reason: String(formData.get("reason") ?? "").trim(),
  };
}

function invalid(values: ReviewValues, reasonRequired = false) {
  return !values.eventId || !values.targetId || (reasonRequired && !values.reason);
}

function refresh(eventId: string) {
  revalidatePath("/admin/events");
  revalidatePath(`/events/${eventId}`);
}

export async function approveEventRevision(formData: FormData) {
  const values = reviewValues(formData);
  if (invalid(values)) redirect("/admin/events?error=invalid-review");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("approve_event_revision", {
    target_revision_id: values.targetId,
    review_reason: values.reason || undefined,
  });

  if (error) redirect("/admin/events?error=revision-review-failed");
  refresh(values.eventId);
  redirect("/admin/events?reviewed=revision-approved");
}

export async function requestEventRevisionChanges(formData: FormData) {
  const values = reviewValues(formData);
  if (invalid(values, true)) redirect("/admin/events?error=review-reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("request_event_revision_changes", {
    target_revision_id: values.targetId,
    review_reason: values.reason,
  });

  if (error) redirect("/admin/events?error=revision-review-failed");
  refresh(values.eventId);
  redirect("/admin/events?reviewed=revision-changes-requested");
}

export async function approveEventCancellation(formData: FormData) {
  const values = reviewValues(formData);
  if (invalid(values, true)) redirect("/admin/events?error=public-reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("approve_event_cancellation", {
    target_request_id: values.targetId,
    public_reason: values.reason,
  });

  if (error) redirect("/admin/events?error=cancellation-review-failed");
  refresh(values.eventId);
  redirect("/admin/events?reviewed=cancellation-approved");
}

export async function requestEventCancellationChanges(formData: FormData) {
  const values = reviewValues(formData);
  if (invalid(values, true)) redirect("/admin/events?error=review-reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("request_event_cancellation_changes", {
    target_request_id: values.targetId,
    review_reason: values.reason,
  });

  if (error) redirect("/admin/events?error=cancellation-review-failed");
  refresh(values.eventId);
  redirect("/admin/events?reviewed=cancellation-changes-requested");
}
