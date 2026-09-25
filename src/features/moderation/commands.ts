"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeEmail } from "@/features/auth/schema";
import { requirePlatformAdmin } from "@/features/moderation/policy";
import { formText } from "@/lib/forms/input";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  if (!candidateId || !reason || !["artist", "venue"].includes(kind) || !["activate", "reject", "merge"].includes(action)) {
    redirect("/admin/entities?error=invalid-review");
  }
  // Anything but activate or reject falls through to a merge below, so an
  // unknown action or a merge without a survivor stops here.
  if (action === "merge" && !survivorId) redirect("/admin/entities?error=invalid-review");
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

/**
 * listing-policy F is decided by a Platform Admin, so both directions are
 * server actions over the trusted database functions rather than table writes.
 * The functions themselves re-check the role and the reason; these checks only
 * keep an obviously empty form from reaching the database.
 */
function withdrawalValues(formData: FormData) {
  return {
    eventId: formText(formData, "eventId"),
    reason: formText(formData, "reason"),
  };
}

function refreshWithdrawal(eventId: string) {
  revalidatePath("/admin/withdrawals");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function withdrawEvent(formData: FormData) {
  const { eventId, reason } = withdrawalValues(formData);
  if (!eventId) redirect("/admin/withdrawals?error=event-required");
  if (!reason) redirect("/admin/withdrawals?error=reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("withdraw_event", {
    target_event_id: eventId,
    withdrawal_reason: reason,
  });

  if (error) redirect("/admin/withdrawals?error=withdrawal-failed");
  refreshWithdrawal(eventId);
  redirect("/admin/withdrawals?done=withdrawn");
}

export async function restoreEvent(formData: FormData) {
  const { eventId, reason } = withdrawalValues(formData);
  if (!eventId) redirect("/admin/withdrawals?error=event-required");
  if (!reason) redirect("/admin/withdrawals?error=reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("restore_event", {
    target_event_id: eventId,
    restoration_reason: reason,
  });

  if (error) redirect("/admin/withdrawals?error=restoration-failed");
  refreshWithdrawal(eventId);
  redirect("/admin/withdrawals?done=restored");
}

/**
 * Invites an Organizer by email (ADR-0025). During the closed beta this is the
 * only way an account is created. The address never goes into the redirect.
 */
export async function inviteOrganizer(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  if (!email) redirect("/admin/invitations?error=invalid-email");

  // The service role is used only once the caller is known to be an admin.
  await requirePlatformAdmin();
  const { error } = await createSupabaseAdminClient().auth.admin.inviteUserByEmail(email);
  if (error) {
    redirect(`/admin/invitations?error=${error.code === "email_exists" ? "already-registered" : "invite-failed"}`);
  }

  redirect("/admin/invitations?invited=1");
}
