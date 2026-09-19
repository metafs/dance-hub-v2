"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { formText } from "@/lib/forms/input";

/**
 * listing-policy F is decided by a Platform Admin, so both directions are
 * server actions over the trusted database functions rather than table writes.
 * The functions themselves re-check the role and the reason; these checks only
 * keep an obviously empty form from reaching the database.
 */
function values(formData: FormData) {
  return {
    eventId: formText(formData, "eventId"),
    reason: formText(formData, "reason"),
  };
}

function refresh(eventId: string) {
  revalidatePath("/admin/withdrawals");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
}

export async function withdrawEvent(formData: FormData) {
  const { eventId, reason } = values(formData);
  if (!eventId) redirect("/admin/withdrawals?error=event-required");
  if (!reason) redirect("/admin/withdrawals?error=reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("withdraw_event", {
    target_event_id: eventId,
    withdrawal_reason: reason,
  });

  if (error) redirect("/admin/withdrawals?error=withdrawal-failed");
  refresh(eventId);
  redirect("/admin/withdrawals?done=withdrawn");
}

export async function restoreEvent(formData: FormData) {
  const { eventId, reason } = values(formData);
  if (!eventId) redirect("/admin/withdrawals?error=event-required");
  if (!reason) redirect("/admin/withdrawals?error=reason-required");

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("restore_event", {
    target_event_id: eventId,
    restoration_reason: reason,
  });

  if (error) redirect("/admin/withdrawals?error=restoration-failed");
  refresh(eventId);
  redirect("/admin/withdrawals?done=restored");
}
