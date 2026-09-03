"use client";

import { TicketOfferEditor } from "@/components/ticket-offer-editor";
import type { EventRevisionFieldErrors } from "@/lib/events/revision-action-state";
import type { TicketOfferDraft } from "@/lib/events/ticket-offers";

type Props = {
  artists: { id: string; name: string }[];
  venues: { id: string; name: string; prefecture?: string }[];
  festivalParents: { id: string; title: string }[];
  ticketOffers?: TicketOfferDraft[];
  defaults?: Record<string, string | boolean | null | undefined>;
  errors?: EventRevisionFieldErrors;
};

function FieldError({ errors, name }: { errors?: EventRevisionFieldErrors; name: keyof EventRevisionFieldErrors }) {
  const messages = errors?.[name];
  return messages?.length ? <span className="field-error" id={`${name}-error`}>{messages.join(" ")}</span> : null;
}

export function EventFields({ artists, venues, festivalParents, ticketOffers = [], defaults, errors }: Props) {
  const value = (name: string) => typeof defaults?.[name] === "string" ? defaults[name] as string : "";
  const invalid = (name: keyof EventRevisionFieldErrors) => Boolean(errors?.[name]?.length);
  const describedBy = (name: keyof EventRevisionFieldErrors) => invalid(name) ? `${name}-error` : undefined;

  return <>
    <label>Event名<input aria-describedby={describedBy("title")} aria-invalid={invalid("title")} name="title" defaultValue={value("title")} maxLength={200} required/><FieldError errors={errors} name="title"/></label>
    <label>説明<textarea aria-describedby={describedBy("description")} aria-invalid={invalid("description")} name="description" defaultValue={value("description")} rows={5}/><FieldError errors={errors} name="description"/></label>
    <label>種別<select aria-describedby={describedBy("eventType")} aria-invalid={invalid("eventType")} name="eventType" defaultValue={value("eventType")}><option value="">下書きでは未選択</option>{["performance", "open_studio", "talk", "workshop", "audition", "open_call", "residency", "festival", "other"].map((type) => <option key={type} value={type}>{type}</option>)}</select><FieldError errors={errors} name="eventType"/></label>
    <label>Festival親Event（子Eventのみ）<select name="proposedParentEventId" defaultValue={value("proposedParentEventId")}><option value="">指定しない</option>{festivalParents.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
    <label>Artist（canonical）<select aria-describedby={describedBy("artistId")} aria-invalid={invalid("artistId")} name="artistId" defaultValue={value("artistId")}><option value="">下書きでは未選択</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select><FieldError errors={errors} name="artistId"/></label>
    <label>クレジット表記<input aria-describedby={describedBy("artistRole")} aria-invalid={invalid("artistRole")} name="artistRole" defaultValue={value("artistRole") || "出演"} maxLength={120}/><FieldError errors={errors} name="artistRole"/></label>
    <label>会場（canonical）<select aria-describedby={describedBy("venueId")} aria-invalid={invalid("venueId")} name="venueId" defaultValue={value("venueId")}><option value="">下書きでは未選択</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.prefecture ? `（${venue.prefecture}）` : ""}</option>)}</select><FieldError errors={errors} name="venueId"/></label>
    <label>開始日時（東京都）<input aria-describedby={describedBy("startsAt")} aria-invalid={invalid("startsAt")} name="startsAt" type="datetime-local" defaultValue={value("startsAt")}/><FieldError errors={errors} name="startsAt"/></label>
    <label>終了日時（東京都）<input aria-describedby={describedBy("endsAt")} aria-invalid={invalid("endsAt")} name="endsAt" type="datetime-local" defaultValue={value("endsAt")}/><FieldError errors={errors} name="endsAt"/></label>
    <label><input name="allDay" type="checkbox" defaultChecked={defaults?.allDay === true}/> 終日</label>
    <div aria-describedby={describedBy("ticketOffers")}><TicketOfferEditor initialOffers={ticketOffers}/><FieldError errors={errors} name="ticketOffers"/></div>
    <fieldset><legend>Ticket Link（外部販売・申込先）</legend><label>URL<input aria-describedby={describedBy("ticketUrl")} aria-invalid={invalid("ticketUrl")} name="ticketUrl" type="url" defaultValue={value("ticketUrl")} placeholder="https://…"/><FieldError errors={errors} name="ticketUrl"/></label><label>リンク種別<select name="ticketKind" defaultValue={value("ticketKind") || "ticket"}><option value="ticket">ticket</option><option value="registration">registration</option></select></label><label>リンク表示名<input aria-describedby={describedBy("ticketLabel")} aria-invalid={invalid("ticketLabel")} name="ticketLabel" defaultValue={value("ticketLabel")} maxLength={120}/><FieldError errors={errors} name="ticketLabel"/></label></fieldset>
    <label><input name="noRegistrationRequired" type="checkbox" defaultChecked={defaults?.noRegistrationRequired === true}/> チケット・登録は不要</label>
    <label>外部リンクURL<input aria-describedby={describedBy("externalUrl")} aria-invalid={invalid("externalUrl")} name="externalUrl" type="url" defaultValue={value("externalUrl")} placeholder="https://…"/><FieldError errors={errors} name="externalUrl"/></label>
    <label>外部リンク表示名<input aria-describedby={describedBy("externalLabel")} aria-invalid={invalid("externalLabel")} name="externalLabel" defaultValue={value("externalLabel") || "公式サイト"} maxLength={120}/><FieldError errors={errors} name="externalLabel"/></label>
    <fieldset><legend>メイン画像メタデータ（下書きでは任意、提出時は必須）</legend><label>object key<input aria-describedby={describedBy("imageObjectKey")} aria-invalid={invalid("imageObjectKey")} name="imageObjectKey" defaultValue={value("imageObjectKey")} maxLength={1024} placeholder="events/example/cover.jpg"/><FieldError errors={errors} name="imageObjectKey"/></label><label>content type<input aria-describedby={describedBy("imageContentType")} aria-invalid={invalid("imageContentType")} name="imageContentType" defaultValue={value("imageContentType")} placeholder="image/jpeg"/><FieldError errors={errors} name="imageContentType"/></label><label>代替テキスト<input aria-describedby={describedBy("imageAlt")} aria-invalid={invalid("imageAlt")} name="imageAlt" defaultValue={value("imageAlt")} maxLength={500}/><FieldError errors={errors} name="imageAlt"/></label></fieldset>
    <label>応募締切（東京都、audition / open_call / residencyで必須）<input aria-describedby={describedBy("applicationDeadline")} aria-invalid={invalid("applicationDeadline")} name="applicationDeadline" type="datetime-local" defaultValue={value("applicationDeadline")}/><FieldError errors={errors} name="applicationDeadline"/></label>
  </>;
}
