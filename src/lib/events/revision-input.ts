import { z } from "zod";

import { formText, httpUrl, tokyoDateTime } from "../forms/input";
import type { EventRevisionField, EventRevisionFieldErrors } from "./revision-action-state";
import { parseTicketOffers, type TicketOfferInput } from "./ticket-offers";

const eventTypes = new Set([
  "performance", "open_studio", "talk", "workshop", "audition", "open_call",
  "residency", "festival", "other",
]);
const applyEventTypes = new Set(["audition", "open_call", "residency"]);

export type EventRevisionInput = {
  organizationId: string;
  eventId: string;
  revisionId: string;
  fields: {
    title: string;
    description: string | null;
    event_type: string | null;
    application_deadline: string | null;
    proposed_parent_event_id: string | null;
    no_registration_required: boolean;
  };
  content: {
    artistId: string | null;
    artistRole: string;
    venueId: string | null;
    startsAt: string | null;
    endsAt: string | null;
    allDay: boolean;
    ticketKind: "ticket" | "registration";
    ticketUrl: string | null;
    ticketLabel: string | null;
    ticketOffers: TicketOfferInput[];
    externalUrl: string | null;
    externalLabel: string;
    imageObjectKey: string | null;
    imageContentType: string | null;
    imageAlt: string | null;
  };
};

type ParseResult =
  | { success: true; data: EventRevisionInput }
  | { success: false; errors: EventRevisionFieldErrors };

const eventRevisionFields = new Set<EventRevisionField>([
  "title", "description", "eventType", "applicationDeadline", "artistId", "artistRole",
  "venueId", "startsAt", "endsAt", "ticketOffers", "ticketUrl", "ticketLabel",
  "externalUrl", "externalLabel", "imageObjectKey", "imageContentType", "imageAlt", "form",
]);

function optionalTokyoDateTime(message: string) {
  return z.string().refine((value) => !value || tokyoDateTime(value) !== null, message);
}

function optionalHttpUrl() {
  return z.string()
    .max(2048, "URLは2048文字以内で入力してください。")
    .refine((value) => !value || httpUrl(value) !== null, "httpまたはhttpsのURLを入力してください。");
}

function eventRevisionSchema({ forSubmission, requireIdentity }: { forSubmission: boolean; requireIdentity: boolean }) {
  return z.object({
    organizationId: z.string(),
    eventId: z.string(),
    revisionId: z.string(),
    title: z.string().min(1, "Event名を入力してください。").max(200, "Event名は200文字以内で入力してください。"),
    description: z.string(),
    eventType: z.string().refine((value) => !value || eventTypes.has(value), "有効な種別を選択してください。"),
    applicationDeadline: optionalTokyoDateTime("有効な応募締切を入力してください。"),
    proposedParentEventId: z.string(),
    noRegistrationRequired: z.boolean(),
    artistId: z.string(),
    artistRole: z.string().max(120, "クレジット表記は120文字以内で入力してください。"),
    venueId: z.string(),
    startsAt: optionalTokyoDateTime("有効な開始日時を入力してください。"),
    endsAt: optionalTokyoDateTime("有効な終了日時を入力してください。"),
    allDay: z.boolean(),
    ticketKind: z.enum(["ticket", "registration"]),
    ticketUrl: optionalHttpUrl(),
    ticketLabel: z.string().max(120, "リンク表示名は120文字以内で入力してください。"),
    ticketOffers: z.array(z.custom<TicketOfferInput>()).nullable(),
    externalUrl: optionalHttpUrl(),
    externalLabel: z.string().max(120, "外部リンク表示名は120文字以内で入力してください。"),
    imageObjectKey: z.string().max(1024, "画像のobject keyは1024文字以内で入力してください。"),
    imageContentType: z.string().max(255, "画像のcontent typeは255文字以内で入力してください。"),
    imageAlt: z.string().max(500, "画像の代替テキストは500文字以内で入力してください。"),
  }).superRefine((value, context) => {
    const issue = (path: EventRevisionField, message: string) => context.addIssue({ code: "custom", path: [path], message });
    const startsAt = tokyoDateTime(value.startsAt);
    const endsAt = tokyoDateTime(value.endsAt);

    if (!value.organizationId || (requireIdentity && (!value.eventId || !value.revisionId))) {
      issue("form", "Event Revisionを特定できません。ページを再読み込みしてください。");
    }
    if (startsAt && !value.venueId) issue("venueId", "開始日時を設定する場合は会場を選択してください。");
    if (endsAt && !startsAt) issue("startsAt", "終了日時を設定する場合は開始日時を入力してください。");
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      issue("endsAt", "終了日時は開始日時より後にしてください。");
    }
    if (value.ticketOffers === null) issue("ticketOffers", "料金の種別、通貨、金額を確認してください。");

    const mediaValues = [value.imageObjectKey, value.imageContentType, value.imageAlt];
    if (mediaValues.some(Boolean) && !value.imageObjectKey) issue("imageObjectKey", "画像のobject keyを入力してください。");
    if (mediaValues.some(Boolean) && !value.imageContentType) issue("imageContentType", "画像のcontent typeを入力してください。");
    if (mediaValues.some(Boolean) && !value.imageAlt) issue("imageAlt", "画像の代替テキストを入力してください。");
    if (value.imageContentType && !value.imageContentType.toLowerCase().startsWith("image/")) {
      issue("imageContentType", "画像のcontent typeを入力してください。");
    }

    if (!forSubmission) return;
    if (!value.description) issue("description", "審査提出には説明が必要です。");
    if (!value.eventType) issue("eventType", "審査提出には種別が必要です。");
    if (!value.artistId) issue("artistId", "審査提出にはArtistが必要です。");
    if (!value.noRegistrationRequired && !httpUrl(value.ticketUrl) && !value.ticketOffers?.length) {
      issue("ticketOffers", "料金、Ticket Link、またはチケット・登録不要のいずれかを設定してください。");
    }
    if (!value.imageObjectKey) issue("imageObjectKey", "審査提出にはメイン画像が必要です。");
    if (!value.imageContentType) issue("imageContentType", "審査提出には画像のcontent typeが必要です。");
    if (!value.imageAlt) issue("imageAlt", "審査提出には画像の代替テキストが必要です。");
    if (value.eventType && applyEventTypes.has(value.eventType)) {
      if (!tokyoDateTime(value.applicationDeadline)) issue("applicationDeadline", "この種別の審査提出には応募締切が必要です。");
    } else if (value.eventType && value.eventType !== "festival") {
      if (!startsAt) issue("startsAt", "この種別の審査提出には開始日時が必要です。");
      if (!value.venueId) issue("venueId", "この種別の審査提出には会場が必要です。");
    }
  });
}

function fieldErrors(error: z.ZodError): EventRevisionFieldErrors {
  const errors: EventRevisionFieldErrors = {};
  for (const issue of error.issues) {
    const candidate = issue.path[0];
    const field = typeof candidate === "string" && eventRevisionFields.has(candidate as EventRevisionField)
      ? candidate as EventRevisionField
      : "form";
    errors[field] = [...(errors[field] ?? []), issue.message];
  }
  return errors;
}

export function parseEventRevisionInput(
  formData: FormData,
  { forSubmission, requireIdentity = true }: { forSubmission: boolean; requireIdentity?: boolean },
): ParseResult {
  const result = eventRevisionSchema({ forSubmission, requireIdentity }).safeParse({
    organizationId: formText(formData, "organizationId"),
    eventId: formText(formData, "eventId"),
    revisionId: formText(formData, "revisionId"),
    title: formText(formData, "title"),
    description: formText(formData, "description"),
    eventType: formText(formData, "eventType"),
    applicationDeadline: formText(formData, "applicationDeadline"),
    proposedParentEventId: formText(formData, "proposedParentEventId"),
    noRegistrationRequired: formData.get("noRegistrationRequired") === "on",
    artistId: formText(formData, "artistId"),
    artistRole: formText(formData, "artistRole") || "出演",
    venueId: formText(formData, "venueId"),
    startsAt: formText(formData, "startsAt"),
    endsAt: formText(formData, "endsAt"),
    allDay: formData.get("allDay") === "on",
    ticketKind: formText(formData, "ticketKind") === "registration" ? "registration" : "ticket",
    ticketUrl: formText(formData, "ticketUrl"),
    ticketLabel: formText(formData, "ticketLabel"),
    ticketOffers: parseTicketOffers(formData),
    externalUrl: formText(formData, "externalUrl"),
    externalLabel: formText(formData, "externalLabel") || "公式サイト",
    imageObjectKey: formText(formData, "imageObjectKey"),
    imageContentType: formText(formData, "imageContentType"),
    imageAlt: formText(formData, "imageAlt"),
  });
  if (!result.success) return { success: false, errors: fieldErrors(result.error) };

  const value = result.data;
  return {
    success: true,
    data: {
      organizationId: value.organizationId,
      eventId: value.eventId,
      revisionId: value.revisionId,
      fields: {
        title: value.title,
        description: value.description || null,
        event_type: value.eventType || null,
        application_deadline: tokyoDateTime(value.applicationDeadline),
        proposed_parent_event_id: value.proposedParentEventId || null,
        no_registration_required: value.noRegistrationRequired,
      },
      content: {
        artistId: value.artistId || null,
        artistRole: value.artistRole,
        venueId: value.venueId || null,
        startsAt: tokyoDateTime(value.startsAt),
        endsAt: tokyoDateTime(value.endsAt),
        allDay: value.allDay,
        ticketKind: value.ticketKind,
        ticketUrl: httpUrl(value.ticketUrl),
        ticketLabel: value.ticketLabel || null,
        ticketOffers: value.ticketOffers!,
        externalUrl: httpUrl(value.externalUrl),
        externalLabel: value.externalLabel,
        imageObjectKey: value.imageObjectKey || null,
        imageContentType: value.imageContentType || null,
        imageAlt: value.imageAlt || null,
      },
    },
  };
}
