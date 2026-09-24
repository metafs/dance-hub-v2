import { z } from "zod";

import { formText, httpUrl, tokyoDateTime } from "@/lib/forms/input";
import type { EventRevisionField, EventRevisionFieldErrors, EventRevisionFormValues } from "./action-state";
import {
  eventTypes as eventTypeValues,
  isEventType,
  ticketPriceTypes,
  type EventType,
  type TicketOfferDraft,
} from "./schema";
import { parseTicketOffers, type TicketOfferInput } from "./ticket-offers";

const eventTypes = new Set<string>(eventTypeValues);
const applyEventTypes = new Set(["audition", "open_call", "residency"]);

export type EventRevisionInput = {
  organizationId: string;
  eventId: string;
  revisionId: string;
  fields: {
    title: string;
    description: string | null;
    event_type: EventType | null;
    application_deadline: string | null;
    proposed_parent_event_id: string | null;
    no_registration_required: boolean;
    contact_kind: "website" | "social" | "email" | null;
    contact_value: string | null;
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
    imageAlt: string | null;
  };
};

type ParseResult =
  | { success: true; data: EventRevisionInput }
  | { success: false; errors: EventRevisionFieldErrors };

const eventRevisionFields = new Set<EventRevisionField>([
  "title", "description", "eventType", "applicationDeadline", "artistId", "artistRole",
  "venueId", "startsAt", "endsAt", "ticketOffers", "ticketUrl", "ticketLabel",
  "externalUrl", "externalLabel", "image", "imageAlt", "form",
  "contactKind", "contactValue",
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
    contactKind: z.enum(["website", "social", "email"]).or(z.literal("")),
    contactValue: z.string().max(500, "問い合わせ先は500文字以内で入力してください。"),
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
    imageAlt: z.string().max(500, "画像の代替テキストは500文字以内で入力してください。"),
  }).superRefine((value, context) => {
    const issue = (path: EventRevisionField, message: string) => context.addIssue({ code: "custom", path: [path], message });
    const startsAt = tokyoDateTime(value.startsAt);
    const endsAt = tokyoDateTime(value.endsAt);

    if (!value.organizationId || (requireIdentity && (!value.eventId || !value.revisionId))) {
      issue("form", "Event Revisionを特定できません。ページを再読み込みしてください。");
    }
    if (startsAt && !value.venueId) issue("venueId", "開始日時を設定する場合は会場を選択してください。");
    if (value.venueId && !startsAt) issue("startsAt", "会場を設定する場合は開始日時を入力してください。");
    if (endsAt && !startsAt) issue("startsAt", "終了日時を設定する場合は開始日時を入力してください。");
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      issue("endsAt", "終了日時は開始日時より後にしてください。");
    }
    if (value.ticketOffers === null) issue("ticketOffers", "料金の種別、通貨、金額を確認してください。");

    if (!forSubmission) return;
    if (!value.description) issue("description", "審査提出には説明が必要です。");
    if (!value.eventType) issue("eventType", "審査提出には種別が必要です。");
    if (value.contactKind === "") issue("contactKind", "審査提出には問い合わせ手段が必要です。");
    if (!value.contactValue) issue("contactValue", "審査提出には問い合わせ先が必要です。");
    if (["website", "social"].includes(value.contactKind) && !httpUrl(value.contactValue)) issue("contactValue", "WebサイトまたはSNSはhttpまたはhttpsのURLで入力してください。");
    if (value.contactKind === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.contactValue)) issue("contactValue", "有効なメールアドレスを入力してください。");
    if (!value.noRegistrationRequired && !httpUrl(value.ticketUrl) && !value.ticketOffers?.length) {
      issue("ticketOffers", "料金、Ticket Link、またはチケット・登録不要のいずれかを設定してください。");
    }
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

export function readEventRevisionFormValues(formData: FormData): EventRevisionFormValues {
  const raw = (name: string) => String(formData.get(name) ?? "");
  const ticketOffers: TicketOfferDraft[] = formData.getAll("ticketOfferKey").map((rawKey, index) => {
    const submittedKey = String(rawKey);
    const key = /^[a-zA-Z0-9_-]+$/.test(submittedKey) ? submittedKey : `submitted-${index}`;
    const field = (name: string) => String(formData.get(`ticketOffer.${submittedKey}.${name}`) ?? "");
    const submittedType = field("priceType");
    const priceType = ticketPriceTypes.includes(submittedType as (typeof ticketPriceTypes)[number])
      ? submittedType as TicketOfferDraft["priceType"]
      : "fixed";
    return {
      key,
      priceType,
      label: field("label"),
      currency: field("currency"),
      amountMinor: field("amountMinor"),
      minAmountMinor: field("minAmountMinor"),
      maxAmountMinor: field("maxAmountMinor"),
      notes: field("notes"),
    };
  });

  return {
    organizationId: raw("organizationId"),
    eventId: raw("eventId"),
    revisionId: raw("revisionId"),
    title: raw("title"),
    description: raw("description"),
    eventType: raw("eventType"),
    applicationDeadline: raw("applicationDeadline"),
    proposedParentEventId: raw("proposedParentEventId"),
    noRegistrationRequired: formData.get("noRegistrationRequired") === "on",
    contactKind: raw("contactKind"),
    contactValue: raw("contactValue"),
    artistId: raw("artistId"),
    artistRole: raw("artistRole"),
    venueId: raw("venueId"),
    startsAt: raw("startsAt"),
    endsAt: raw("endsAt"),
    allDay: formData.get("allDay") === "on",
    ticketKind: raw("ticketKind") === "registration" ? "registration" : "ticket",
    ticketUrl: raw("ticketUrl"),
    ticketLabel: raw("ticketLabel"),
    externalUrl: raw("externalUrl"),
    externalLabel: raw("externalLabel"),
    imageAlt: raw("imageAlt"),
    ticketOffers,
  };
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
    contactKind: formText(formData, "contactKind"),
    contactValue: formText(formData, "contactValue"),
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
        event_type: value.eventType && isEventType(value.eventType) ? value.eventType : null,
        application_deadline: tokyoDateTime(value.applicationDeadline),
        proposed_parent_event_id: value.proposedParentEventId || null,
        no_registration_required: value.noRegistrationRequired,
        contact_kind: value.contactKind || null,
        contact_value: value.contactValue || null,
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
        imageAlt: value.imageAlt || null,
      },
    },
  };
}
