"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationCapability } from "@/features/organizations/policy";
import type { EventRevisionActionState } from "@/lib/events/revision-action-state";
import { parseEventRevisionInput, readEventRevisionFormValues } from "@/lib/events/revision-input";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function eventPath(organizationId: string, eventId?: string) {
  return eventId
    ? `/workspace/${organizationId}/events/${eventId}`
    : `/workspace/${organizationId}/events`;
}

function actionError(
  formData: FormData,
  message: string,
  fieldErrors: EventRevisionActionState["fieldErrors"],
): EventRevisionActionState {
  return { status: "error", message, fieldErrors, values: readEventRevisionFormValues(formData) };
}

// Compatibility actions for the existing field-level validation forms.
export async function createEventDraftWithState(
  _previousState: EventRevisionActionState,
  formData: FormData,
): Promise<EventRevisionActionState> {
  const organizationId = text(formData, "organizationId");
  if (!organizationId) return actionError(formData, "Organizationを特定できません。", { form: ["ページを再読み込みしてください。"] });
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const parsed = parseEventRevisionInput(formData, { forSubmission: false, requireIdentity: false });
  if (!parsed.success) return actionError(formData, "入力内容を確認してください。", parsed.errors);

  const { fields, content: revisionContent } = parsed.data;
  const { data: eventId, error } = await supabase.rpc("create_event_draft_with_content", {
    target_organization_id: organizationId,
    revision_fields: fields,
    revision_content: revisionContent,
  });
  if (error || !eventId) return actionError(formData, "下書きを作成できませんでした。", { form: ["入力内容と関連情報を確認し、もう一度お試しください。"] });
  revalidatePath(eventPath(organizationId));
  redirect(`${eventPath(organizationId, eventId)}?created=1`);
}

export async function mutateEventDraftWithState(
  _previousState: EventRevisionActionState,
  formData: FormData,
): Promise<EventRevisionActionState> {
  const organizationId = text(formData, "organizationId");
  const eventId = text(formData, "eventId");
  const revisionId = text(formData, "revisionId");
  if (!organizationId || !eventId || !revisionId) return actionError(formData, "Event Revisionを特定できません。", { form: ["ページを再読み込みしてください。"] });
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const intent = text(formData, "intent");
  if (intent !== "save" && intent !== "submit") return actionError(formData, "操作を確認できませんでした。", { form: ["ページを再読み込みしてください。"] });
  const submit = intent === "submit";
  const parsed = parseEventRevisionInput(formData, { forSubmission: submit });
  if (!parsed.success) return actionError(formData, submit ? "審査提出に必要な項目を確認してください。" : "入力内容を確認してください。", parsed.errors);

  const { fields, content: revisionContent } = parsed.data;
  const { error: revisionError } = await supabase.rpc("save_event_revision_with_content", {
    target_event_id: eventId,
    target_revision_id: revisionId,
    revision_fields: fields,
    revision_content: revisionContent,
    submit_for_review: submit,
  }).select("id").single();
  if (revisionError) return actionError(formData, submit ? "審査へ提出できませんでした。" : "このRevisionを保存できませんでした。編集可能な状態か確認してください。", { form: [submit ? "公開条件を満たしているか確認してください。" : "保存対象が見つからないか、編集できない状態です。"] });
  revalidatePath(eventPath(organizationId));
  redirect(`${eventPath(organizationId, eventId)}?${submit ? "submitted=1" : "saved=1"}`);
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
