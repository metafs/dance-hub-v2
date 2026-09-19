"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationCapability } from "@/features/organizations/policy";
import {
  mainImageObjectKey,
  mainImageRejectionMessages,
  validateMainImagePairing,
  validateMainImageUpload,
} from "@/features/media/schema";
import { putMainImage } from "@/features/media/storage";
import type { EventRevisionActionState } from "@/lib/events/revision-action-state";
import { parseEventRevisionInput, readEventRevisionFormValues } from "@/lib/events/revision-input";

type OrganizationSupabase = Awaited<
  ReturnType<typeof requireOrganizationCapability>
>["supabase"];

type MainImageResolution =
  | { ok: true; imageObjectKey: string | null; imageContentType: string | null }
  | { ok: false; field: "image" | "imageAlt"; message: string };

/**
 * Decides which object this Revision's main image points at.
 *
 * A newly chosen file is validated and written to R2 under a server-derived key
 * before any metadata is saved, so metadata never points at an object that does
 * not exist (ADR-0016). With no new file, the Revision keeps the object it
 * already references — read from the database rather than from a hidden form
 * field, because a client-supplied object key is never accepted.
 *
 * The object a replacement supersedes is left in place: Revision drafts copy
 * object keys, so another Revision may still reference it.
 *
 * The alt text is checked against the resolved object before anything is
 * written, so a save that cannot produce a complete `event_media` row does not
 * leave an object behind in R2 that nothing will ever reference.
 */
async function resolveMainImage(
  supabase: OrganizationSupabase,
  formData: FormData,
  { eventId, altText, forSubmission }: { eventId: string; altText: string | null; forSubmission: boolean },
): Promise<MainImageResolution> {
  const revisionId = text(formData, "revisionId");
  const upload = formData.get("image");
  const file = upload instanceof File && upload.size > 0 ? upload : null;

  if (file) {
    const pairing = validateMainImagePairing({ hasObject: true, altText });
    if (!pairing.ok) return pairing;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateMainImageUpload({
      declaredContentType: file.type,
      bytes,
    });
    if (!validation.ok) {
      return { ok: false, field: "image", message: mainImageRejectionMessages[validation.reason] };
    }

    const objectKey = mainImageObjectKey(
      eventId,
      crypto.randomUUID(),
      validation.extension,
    );
    if (!objectKey) {
      return { ok: false, field: "image", message: "画像の保存先を決定できませんでした。" };
    }

    try {
      await putMainImage(objectKey, bytes, validation.contentType);
    } catch {
      return { ok: false, field: "image", message: "画像を保存できませんでした。もう一度お試しください。" };
    }

    return { ok: true, imageObjectKey: objectKey, imageContentType: validation.contentType };
  }

  const { data: existing } = await supabase
    .from("event_media")
    .select("object_key, content_type")
    .eq("event_revision_id", revisionId)
    .eq("is_main", true)
    .maybeSingle();

  if (!existing && forSubmission) {
    return { ok: false, field: "image", message: "審査提出にはメイン画像が必要です。" };
  }

  const pairing = validateMainImagePairing({ hasObject: Boolean(existing?.object_key), altText });
  if (!pairing.ok) return pairing;

  return {
    ok: true,
    imageObjectKey: existing?.object_key ?? null,
    imageContentType: existing?.content_type ?? null,
  };
}

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

  const { fields, content } = parsed.data;
  // The object key is namespaced by Event id, which does not exist until this
  // call returns, so a main image is added from the Event's own edit page. The
  // alt text goes with it: an event_media row needs an object key as well, so
  // alt text alone would ask the database for a row it cannot hold.
  const revisionContent = {
    ...content,
    imageObjectKey: null,
    imageContentType: null,
    imageAlt: null,
  };
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

  const { fields, content } = parsed.data;
  const image = await resolveMainImage(supabase, formData, { eventId, altText: content.imageAlt, forSubmission: submit });
  if (!image.ok) return actionError(formData, "メイン画像を確認してください。", { [image.field]: [image.message] });

  const revisionContent = {
    ...content,
    imageObjectKey: image.imageObjectKey,
    imageContentType: image.imageContentType,
  };
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
