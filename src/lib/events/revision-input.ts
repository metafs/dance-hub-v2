import { formText, httpUrl, tokyoDateTime } from "../forms/input";

import { parseTicketOffers, type TicketOfferInput } from "./ticket-offers";

const eventTypes = new Set([
  "performance", "open_studio", "talk", "workshop", "audition", "open_call",
  "residency", "festival", "other",
]);
const applyEventTypes = new Set(["audition", "open_call", "residency"]);

export type EventRevisionField =
  | "title" | "description" | "eventType" | "applicationDeadline"
  | "artistId" | "artistRole" | "venueId" | "startsAt" | "endsAt" | "ticketOffers"
  | "ticketUrl" | "ticketLabel" | "externalUrl" | "externalLabel"
  | "imageObjectKey" | "imageContentType" | "imageAlt" | "form";

export type EventRevisionFieldErrors = Partial<Record<EventRevisionField, string[]>>;

export type EventRevisionActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors: EventRevisionFieldErrors;
};

export const initialEventRevisionActionState: EventRevisionActionState = {
  status: "idle",
  fieldErrors: {},
};

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

function addError(errors: EventRevisionFieldErrors, field: EventRevisionField, message: string) {
  errors[field] = [...(errors[field] ?? []), message];
}

export function parseEventRevisionInput(
  formData: FormData,
  { forSubmission, requireIdentity = true }: { forSubmission: boolean; requireIdentity?: boolean },
): ParseResult {
  const errors: EventRevisionFieldErrors = {};
  const organizationId = formText(formData, "organizationId");
  const eventId = formText(formData, "eventId");
  const revisionId = formText(formData, "revisionId");
  const title = formText(formData, "title");
  const description = formText(formData, "description");
  const eventType = formText(formData, "eventType");
  const deadlineInput = formText(formData, "applicationDeadline");
  const applicationDeadline = tokyoDateTime(deadlineInput);
  const artistId = formText(formData, "artistId");
  const artistRole = formText(formData, "artistRole") || "出演";
  const venueId = formText(formData, "venueId");
  const startsInput = formText(formData, "startsAt");
  const endsInput = formText(formData, "endsAt");
  const startsAt = tokyoDateTime(startsInput);
  const endsAt = tokyoDateTime(endsInput);
  const objectKey = formText(formData, "imageObjectKey");
  const contentType = formText(formData, "imageContentType");
  const imageAlt = formText(formData, "imageAlt");
  const ticketUrlInput = formText(formData, "ticketUrl");
  const ticketLabel = formText(formData, "ticketLabel");
  const externalUrlInput = formText(formData, "externalUrl");
  const externalLabel = formText(formData, "externalLabel") || "公式サイト";
  const ticketUrl = httpUrl(ticketUrlInput);
  const externalUrl = httpUrl(externalUrlInput);
  const ticketOffers = parseTicketOffers(formData);
  const noRegistrationRequired = formData.get("noRegistrationRequired") === "on";

  if (!organizationId || (requireIdentity && (!eventId || !revisionId))) {
    addError(errors, "form", "Event Revisionを特定できません。ページを再読み込みしてください。");
  }
  if (!title) addError(errors, "title", "Event名を入力してください。");
  else if (title.length > 200) addError(errors, "title", "Event名は200文字以内で入力してください。");
  if (eventType && !eventTypes.has(eventType)) addError(errors, "eventType", "有効な種別を選択してください。");
  if (artistRole.length > 120) addError(errors, "artistRole", "クレジット表記は120文字以内で入力してください。");
  if (deadlineInput && !applicationDeadline) addError(errors, "applicationDeadline", "有効な応募締切を入力してください。");
  if (startsInput && !startsAt) addError(errors, "startsAt", "有効な開始日時を入力してください。");
  if (endsInput && !endsAt) addError(errors, "endsAt", "有効な終了日時を入力してください。");
  if (startsAt && !venueId) addError(errors, "venueId", "開始日時を設定する場合は会場を選択してください。");
  if (endsAt && !startsAt) addError(errors, "startsAt", "終了日時を設定する場合は開始日時を入力してください。");
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) addError(errors, "endsAt", "終了日時は開始日時より後にしてください。");
  if (ticketOffers === null) addError(errors, "ticketOffers", "料金の種別、通貨、金額を確認してください。");
  if (ticketUrlInput && !ticketUrl) addError(errors, "ticketUrl", "httpまたはhttpsのURLを入力してください。");
  else if (ticketUrlInput.length > 2048) addError(errors, "ticketUrl", "URLは2048文字以内で入力してください。");
  if (ticketLabel.length > 120) addError(errors, "ticketLabel", "リンク表示名は120文字以内で入力してください。");
  if (externalUrlInput && !externalUrl) addError(errors, "externalUrl", "httpまたはhttpsのURLを入力してください。");
  else if (externalUrlInput.length > 2048) addError(errors, "externalUrl", "URLは2048文字以内で入力してください。");
  if (externalLabel.length > 120) addError(errors, "externalLabel", "外部リンク表示名は120文字以内で入力してください。");

  const mediaValues = [objectKey, contentType, imageAlt];
  if (mediaValues.some(Boolean) && !objectKey) addError(errors, "imageObjectKey", "画像のobject keyを入力してください。");
  if (mediaValues.some(Boolean) && !contentType) addError(errors, "imageContentType", "画像のcontent typeを入力してください。");
  if (mediaValues.some(Boolean) && !imageAlt) addError(errors, "imageAlt", "画像の代替テキストを入力してください。");
  if (objectKey.length > 1024) addError(errors, "imageObjectKey", "画像のobject keyは1024文字以内で入力してください。");
  if (contentType.length > 255) addError(errors, "imageContentType", "画像のcontent typeは255文字以内で入力してください。");
  if (contentType && !contentType.toLowerCase().startsWith("image/")) addError(errors, "imageContentType", "画像のcontent typeを入力してください。");
  if (imageAlt.length > 500) addError(errors, "imageAlt", "画像の代替テキストは500文字以内で入力してください。");

  if (forSubmission) {
    if (!description) addError(errors, "description", "審査提出には説明が必要です。");
    if (!eventType) addError(errors, "eventType", "審査提出には種別が必要です。");
    if (!artistId) addError(errors, "artistId", "審査提出にはArtistが必要です。");
    if (!noRegistrationRequired && !ticketUrl && !(ticketOffers?.length)) {
      addError(errors, "ticketOffers", "料金、Ticket Link、またはチケット・登録不要のいずれかを設定してください。");
    }
    if (!objectKey) addError(errors, "imageObjectKey", "審査提出にはメイン画像が必要です。");
    if (!contentType) addError(errors, "imageContentType", "審査提出には画像のcontent typeが必要です。");
    if (!imageAlt) addError(errors, "imageAlt", "審査提出には画像の代替テキストが必要です。");
    if (eventType && applyEventTypes.has(eventType)) {
      if (!applicationDeadline) addError(errors, "applicationDeadline", "この種別の審査提出には応募締切が必要です。");
    } else if (eventType && eventType !== "festival") {
      if (!startsAt) addError(errors, "startsAt", "この種別の審査提出には開始日時が必要です。");
      if (!venueId) addError(errors, "venueId", "この種別の審査提出には会場が必要です。");
    }
  }

  if (Object.keys(errors).length > 0 || ticketOffers === null) return { success: false, errors };

  return {
    success: true,
    data: {
      organizationId,
      eventId,
      revisionId,
      fields: {
        title,
        description: description || null,
        event_type: eventType || null,
        application_deadline: applicationDeadline,
        proposed_parent_event_id: formText(formData, "proposedParentEventId") || null,
        no_registration_required: noRegistrationRequired,
      },
      content: {
        artistId: artistId || null,
        artistRole,
        venueId: venueId || null,
        startsAt,
        endsAt,
        allDay: formData.get("allDay") === "on",
        ticketKind: formText(formData, "ticketKind") === "registration" ? "registration" : "ticket",
        ticketUrl,
        ticketLabel: ticketLabel || null,
        ticketOffers,
        externalUrl,
        externalLabel,
        imageObjectKey: objectKey || null,
        imageContentType: contentType || null,
        imageAlt: imageAlt || null,
      },
    },
  };
}
