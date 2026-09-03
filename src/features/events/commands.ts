"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationCapability } from "@/features/organizations/policy";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function eventPath(organizationId: string, eventId: string) {
  return `/workspace/${organizationId}/events/${eventId}`;
}

function invalid(organizationId: string, eventId: string): never {
  redirect(`${eventPath(organizationId, eventId)}?error=invalid-input`);
}

export async function requestEventCancellation(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const eventId = text(formData, "eventId");
  const reason = text(formData, "reason");
  if (!organizationId || !eventId || !reason || reason.length > 2000) {
    invalid(organizationId, eventId);
  }
  const { supabase } = await requireOrganizationCapability(
    organizationId,
    "requestCancellation",
  );
  const { error } = await supabase.rpc("request_event_cancellation", {
    target_event_id: eventId,
    requested_reason: reason,
  });
  if (error) {
    redirect(`${eventPath(organizationId, eventId)}?error=cancellation-request`);
  }
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
  const { supabase } = await requireOrganizationCapability(
    organizationId,
    "requestCancellation",
  );
  const { error } = await supabase.rpc("resubmit_event_cancellation_request", {
    target_request_id: requestId,
    requested_reason: reason,
  });
  if (error) {
    redirect(`${eventPath(organizationId, eventId)}?error=cancellation-resubmit`);
  }
  revalidatePath(eventPath(organizationId, eventId));
  redirect(`${eventPath(organizationId, eventId)}?cancellation=resubmitted`);
}
