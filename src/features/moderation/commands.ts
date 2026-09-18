"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/features/moderation/policy";

function reviewValues(formData: FormData) {
  return {
    applicationId: String(formData.get("applicationId") ?? ""),
    reason: String(formData.get("reason") ?? "").trim(),
  };
}

export async function approveApplication(formData: FormData) {
  const { applicationId, reason } = reviewValues(formData);
  if (!applicationId) redirect("/admin/applications?error=invalid-application");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("approve_organization_application", {
    application_id: applicationId,
    decision_reason: reason || undefined,
  });

  if (error) redirect("/admin/applications?error=review-failed");
  revalidatePath("/admin/applications");
  redirect("/admin/applications?reviewed=approved");
}

export async function rejectApplication(formData: FormData) {
  const { applicationId, reason } = reviewValues(formData);
  if (!applicationId || !reason) redirect("/admin/applications?error=rejection-reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("reject_organization_application", {
    application_id: applicationId,
    decision_reason: reason,
  });

  if (error) redirect("/admin/applications?error=review-failed");
  revalidatePath("/admin/applications");
  redirect("/admin/applications?reviewed=rejected");
}

export async function reviewCandidate(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const action = String(formData.get("action") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const survivorId = String(formData.get("survivorId") ?? "");
  if (!candidateId || !reason || !["artist", "venue"].includes(kind)) {
    redirect("/admin/entities?error=invalid-review");
  }
  const { supabase } = await requirePlatformAdmin();
  const { error } = kind === "artist"
    ? action === "activate"
      ? await supabase.rpc("activate_artist_candidate", {
        candidate_id: candidateId,
        reason,
      })
      : action === "reject"
        ? await supabase.rpc("reject_artist_candidate", {
          candidate_id: candidateId,
          reason,
        })
        : await supabase.rpc("merge_artist_candidate", {
          candidate_id: candidateId,
          survivor_artist_id: survivorId,
          reason,
        })
    : action === "activate"
      ? await supabase.rpc("activate_venue_candidate", {
        candidate_id: candidateId,
        reason,
      })
      : action === "reject"
        ? await supabase.rpc("reject_venue_candidate", {
          candidate_id: candidateId,
          reason,
        })
        : await supabase.rpc("merge_venue_candidate", {
          candidate_id: candidateId,
          survivor_venue_id: survivorId,
          reason,
        });
  if (error) redirect("/admin/entities?error=review-failed");
  revalidatePath("/admin/entities");
  redirect("/admin/entities?reviewed=1");
}

type EventReviewValues = {
  eventId: string;
  targetId: string;
  reason: string;
};

function eventReviewValues(formData: FormData): EventReviewValues {
  return {
    eventId: String(formData.get("eventId") ?? ""),
    targetId: String(formData.get("targetId") ?? ""),
    reason: String(formData.get("reason") ?? "").trim(),
  };
}

function hasInvalidEventReview(
  values: EventReviewValues,
  reasonRequired = false,
) {
  return !values.eventId || !values.targetId || (reasonRequired && !values.reason);
}

function refreshEventReview(eventId: string) {
  revalidatePath("/admin/events");
  revalidatePath(`/events/${eventId}`);
}

export async function approveEventRevision(formData: FormData) {
  const values = eventReviewValues(formData);
  if (hasInvalidEventReview(values)) {
    redirect("/admin/events?error=invalid-review");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("approve_event_revision", {
    target_revision_id: values.targetId,
    review_reason: values.reason || undefined,
  });

  if (error) redirect("/admin/events?error=revision-review-failed");
  refreshEventReview(values.eventId);
  redirect("/admin/events?reviewed=revision-approved");
}

export async function requestEventRevisionChanges(formData: FormData) {
  const values = eventReviewValues(formData);
  if (hasInvalidEventReview(values, true)) {
    redirect("/admin/events?error=review-reason-required");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("request_event_revision_changes", {
    target_revision_id: values.targetId,
    review_reason: values.reason,
  });

  if (error) redirect("/admin/events?error=revision-review-failed");
  refreshEventReview(values.eventId);
  redirect("/admin/events?reviewed=revision-changes-requested");
}

export async function approveEventCancellation(formData: FormData) {
  const values = eventReviewValues(formData);
  if (hasInvalidEventReview(values, true)) {
    redirect("/admin/events?error=public-reason-required");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("approve_event_cancellation", {
    target_request_id: values.targetId,
    public_reason: values.reason,
  });

  if (error) redirect("/admin/events?error=cancellation-review-failed");
  refreshEventReview(values.eventId);
  redirect("/admin/events?reviewed=cancellation-approved");
}

export async function requestEventCancellationChanges(formData: FormData) {
  const values = eventReviewValues(formData);
  if (hasInvalidEventReview(values, true)) {
    redirect("/admin/events?error=review-reason-required");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("request_event_cancellation_changes", {
    target_request_id: values.targetId,
    review_reason: values.reason,
  });

  if (error) redirect("/admin/events?error=cancellation-review-failed");
  refreshEventReview(values.eventId);
  redirect("/admin/events?reviewed=cancellation-changes-requested");
}
