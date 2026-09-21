"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/features/moderation/policy";
import { formText } from "@/lib/forms/input";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type TurnstileResponse = { success: boolean };

async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;
  const body = new URLSearchParams({ response: token, secret });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  return (await response.json() as TurnstileResponse).success;
}

export async function submitListingRequest(formData: FormData) {
  const eventId = formText(formData, "eventId");
  const rawKind = formText(formData, "kind");
  const kind = rawKind === "correction" ? "correction" : rawKind === "withdrawal" ? "withdrawal" : null;
  const requesterContact = formText(formData, "requesterContact");
  const message = formText(formData, "message");
  const token = formText(formData, "cf-turnstile-response");
  if (!eventId || !kind || !requesterContact || !message) {
    redirect(`/listing-requests?event=${encodeURIComponent(eventId)}&kind=${encodeURIComponent(rawKind)}&error=invalid-input`);
  }
  if (!(await verifyTurnstile(token))) {
    redirect(`/listing-requests?event=${encodeURIComponent(eventId)}&kind=${encodeURIComponent(kind)}&error=verification-failed`);
  }
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("listing_requests").insert({
    event_id: eventId,
    kind,
    requester_contact: requesterContact,
    message,
  });
  if (error) redirect(`/listing-requests?event=${encodeURIComponent(eventId)}&kind=${encodeURIComponent(kind)}&error=submit-failed`);
  redirect("/listing-requests?submitted=1");
}

export async function resolveListingRequest(formData: FormData) {
  const requestId = formText(formData, "requestId");
  const note = formText(formData, "note");
  if (!requestId) redirect("/admin/withdrawals?requestError=invalid-request");
  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("mark_listing_request_resolved", { target_request_id: requestId, note });
  if (error) redirect("/admin/withdrawals?requestError=resolve-failed");
  revalidatePath("/admin/withdrawals");
  redirect("/admin/withdrawals?requestResolved=1");
}

export async function markEventAsProxy(formData: FormData) {
  const eventId = formText(formData, "eventId");
  if (!eventId) redirect("/admin/withdrawals?proxyError=event-required");
  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("mark_event_as_proxy", { target_event_id: eventId });
  if (error) redirect("/admin/withdrawals?proxyError=mark-failed");
  revalidatePath(`/events/${eventId}`);
  redirect("/admin/withdrawals?proxyMarked=1");
}
