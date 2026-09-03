"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationCapability } from "@/lib/auth/authorization";
import type { EventRevisionActionState } from "@/lib/events/revision-action-state";
import { parseEventRevisionInput } from "@/lib/events/revision-input";
import { replaceEventRevisionContent } from "@/lib/events/revision-service";
import { formText } from "@/lib/forms/input";

function eventPath(organizationId: string, eventId?: string) {
  return eventId ? `/workspace/${organizationId}/events/${eventId}` : `/workspace/${organizationId}/events`;
}

export async function createEventDraft(
  _previousState: EventRevisionActionState,
  formData: FormData,
): Promise<EventRevisionActionState> {
  const organizationId = formText(formData, "organizationId");
  if (!organizationId) redirect("/workspace");
  const { supabase, user } = await requireOrganizationCapability(organizationId, "editEvents");
  const parsed = parseEventRevisionInput(formData, { forSubmission: false, requireIdentity: false });
  if (!parsed.success) {
    return { status: "error", message: "入力内容を確認してください。", fieldErrors: parsed.errors };
  }

  const { fields, content } = parsed.data;
  const { data: event, error: eventError } = await supabase.from("events").insert({ owner_organization_id: organizationId }).select("id").single();
  if (eventError || !event) {
    return { status: "error", message: "下書きを作成できませんでした。", fieldErrors: { form: ["時間をおいてもう一度お試しください。"] } };
  }
  const { data: revision, error: revisionError } = await supabase.from("event_revisions").insert({ event_id: event.id, created_by: user.id, ...fields }).select("id").single();
  if (revisionError || !revision) {
    return { status: "error", message: "下書きを作成できませんでした。", fieldErrors: { form: ["入力内容を確認して、もう一度お試しください。"] } };
  }
  const contentError = await replaceEventRevisionContent(supabase, revision.id, content);
  if (contentError) {
    return { status: "error", message: "関連情報を保存できませんでした。", fieldErrors: { form: ["Artist、会場、料金、リンク、画像の内容を確認してください。"] } };
  }
  revalidatePath(eventPath(organizationId));
  redirect(`${eventPath(organizationId, event.id)}?created=1`);
}

export async function mutateEventDraft(
  _previousState: EventRevisionActionState,
  formData: FormData,
): Promise<EventRevisionActionState> {
  const organizationId = formText(formData, "organizationId");
  const eventId = formText(formData, "eventId");
  const revisionId = formText(formData, "revisionId");
  if (!organizationId || !eventId || !revisionId) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");

  const intent = formText(formData, "intent");
  if (intent !== "save" && intent !== "submit") {
    return { status: "error", message: "操作を確認できませんでした。", fieldErrors: { form: ["ページを再読み込みしてください。"] } };
  }
  const submit = intent === "submit";
  const parsed = parseEventRevisionInput(formData, { forSubmission: submit });
  if (!parsed.success) {
    return {
      status: "error",
      message: submit ? "審査提出に必要な項目を確認してください。" : "入力内容を確認してください。",
      fieldErrors: parsed.errors,
    };
  }

  const { fields, content } = parsed.data;
  const { error: revisionError } = await supabase.from("event_revisions").update(fields).eq("id", revisionId).eq("event_id", eventId);
  if (revisionError) {
    return { status: "error", message: "このRevisionを保存できませんでした。編集可能な状態か確認してください。", fieldErrors: { form: ["保存対象が見つからないか、編集できない状態です。"] } };
  }
  const contentError = await replaceEventRevisionContent(supabase, revisionId, content);
  if (contentError) {
    return { status: "error", message: "関連情報を保存できませんでした。", fieldErrors: { form: ["Artist、会場、料金、リンク、画像の内容を確認してください。"] } };
  }
  if (submit) {
    const { error } = await supabase.rpc("submit_event_revision", { target_revision_id: revisionId });
    if (error) return { status: "error", message: "審査へ提出できませんでした。", fieldErrors: { form: ["公開条件を満たしているか確認してください。"] } };
  }
  revalidatePath(eventPath(organizationId));
  redirect(`${eventPath(organizationId, eventId)}?${submit ? "submitted=1" : "saved=1"}`);
}

export async function createNextEventRevisionDraft(formData: FormData) {
  const organizationId = formText(formData, "organizationId");
  const eventId = formText(formData, "eventId");
  if (!organizationId || !eventId) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const { data: revisionId, error } = await supabase.rpc("create_event_revision_draft", { target_event_id: eventId });
  if (error || !revisionId) redirect(`${eventPath(organizationId, eventId)}?error=revision-create`);
  revalidatePath(eventPath(organizationId, eventId));
  redirect(`${eventPath(organizationId, eventId)}?revision=${revisionId}&created=1`);
}

export async function requestEventCancellation(formData: FormData) {
  const organizationId = formText(formData, "organizationId");
  const eventId = formText(formData, "eventId");
  const reason = formText(formData, "reason");
  if (!organizationId || !eventId || !reason || reason.length > 2000) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "requestCancellation");
  const { error } = await supabase.rpc("request_event_cancellation", { target_event_id: eventId, requested_reason: reason });
  if (error) redirect(`${eventPath(organizationId, eventId)}?error=cancellation-request`);
  revalidatePath(eventPath(organizationId, eventId));
  redirect(`${eventPath(organizationId, eventId)}?cancellation=requested`);
}

export async function resubmitEventCancellation(formData: FormData) {
  const organizationId = formText(formData, "organizationId");
  const eventId = formText(formData, "eventId");
  const requestId = formText(formData, "requestId");
  const reason = formText(formData, "reason");
  if (!organizationId || !eventId || !requestId || !reason || reason.length > 2000) redirect("/workspace");
  const { supabase } = await requireOrganizationCapability(organizationId, "requestCancellation");
  const { error } = await supabase.rpc("resubmit_event_cancellation_request", { target_request_id: requestId, requested_reason: reason });
  if (error) redirect(`${eventPath(organizationId, eventId)}?error=cancellation-resubmit`);
  revalidatePath(eventPath(organizationId, eventId));
  redirect(`${eventPath(organizationId, eventId)}?cancellation=resubmitted`);
}
