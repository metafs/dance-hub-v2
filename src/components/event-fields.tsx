"use client";

import { TicketOfferEditor } from "@/components/ticket-offer-editor";
import type { EventRevisionFieldErrors } from "@/lib/events/revision-action-state";
import type { TicketOfferDraft } from "@/lib/events/ticket-offers";

type Props = {
  artists: { id: string; name: string }[];
  venues: { id: string; name: string; prefecture?: string }[];
  festivalParents: { id: string; title: string }[];
  ticketOffers?: TicketOfferDraft[];
  /**
   * False while creating a draft: the object key is namespaced by Event id,
   * which does not exist until that call returns, so neither the file nor its
   * alt text can be stored yet (ADR-0016).
   */
  imageEditable?: boolean;
  hasMainImage?: boolean;
  defaults?: Record<string, string | boolean | null | undefined>;
  errors?: EventRevisionFieldErrors;
};

function FieldError({ errors, name }: { errors?: EventRevisionFieldErrors; name: keyof EventRevisionFieldErrors }) {
  const messages = errors?.[name];
  return messages?.length ? <span className="field-error" id={`${name}-error`}>{messages.join(" ")}</span> : null;
}

export function EventFields({ artists, venues, festivalParents, ticketOffers = [], imageEditable = false, hasMainImage = false, defaults, errors }: Props) {
  const value = (name: string) => typeof defaults?.[name] === "string" ? defaults[name] as string : "";
  const invalid = (name: keyof EventRevisionFieldErrors) => Boolean(errors?.[name]?.length);
  const describedBy = (name: keyof EventRevisionFieldErrors) => invalid(name) ? `${name}-error` : undefined;

  return <>
    <div className="field"><label>Event名<input aria-describedby={describedBy("title")} aria-invalid={invalid("title")} name="title" defaultValue={value("title")} maxLength={200} required/></label><FieldError errors={errors} name="title"/></div>
    <div className="field"><label>説明<textarea aria-describedby={describedBy("description")} aria-invalid={invalid("description")} name="description" defaultValue={value("description")} rows={5}/></label><FieldError errors={errors} name="description"/></div>
    <div className="field"><label>種別<select aria-describedby={describedBy("eventType")} aria-invalid={invalid("eventType")} name="eventType" defaultValue={value("eventType")}><option value="">下書きでは未選択</option>{["performance", "open_studio", "talk", "workshop", "audition", "open_call", "residency", "festival", "other"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label><FieldError errors={errors} name="eventType"/></div>
    <label>Festival親Event（子Eventのみ）<select name="proposedParentEventId" defaultValue={value("proposedParentEventId")}><option value="">指定しない</option>{festivalParents.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
    <div className="field"><label>Artist（canonical）<select aria-describedby={describedBy("artistId")} aria-invalid={invalid("artistId")} name="artistId" defaultValue={value("artistId")}><option value="">下書きでは未選択</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><FieldError errors={errors} name="artistId"/></div>
    <div className="field"><label>クレジット表記<input aria-describedby={describedBy("artistRole")} aria-invalid={invalid("artistRole")} name="artistRole" defaultValue={value("artistRole") || "出演"} maxLength={120}/></label><FieldError errors={errors} name="artistRole"/></div>
    <div className="field"><label>会場（canonical）<select aria-describedby={describedBy("venueId")} aria-invalid={invalid("venueId")} name="venueId" defaultValue={value("venueId")}><option value="">下書きでは未選択</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.prefecture ? `（${venue.prefecture}）` : ""}</option>)}</select></label><FieldError errors={errors} name="venueId"/></div>
    <div className="field"><label>開始日時（東京都）<input aria-describedby={describedBy("startsAt")} aria-invalid={invalid("startsAt")} name="startsAt" type="datetime-local" defaultValue={value("startsAt")}/></label><FieldError errors={errors} name="startsAt"/></div>
    <div className="field"><label>終了日時（東京都）<input aria-describedby={describedBy("endsAt")} aria-invalid={invalid("endsAt")} name="endsAt" type="datetime-local" defaultValue={value("endsAt")}/></label><FieldError errors={errors} name="endsAt"/></div>
    <label><input name="allDay" type="checkbox" defaultChecked={defaults?.allDay === true}/> 終日</label>
    <div className="field"><TicketOfferEditor describedBy={describedBy("ticketOffers")} initialOffers={ticketOffers}/><FieldError errors={errors} name="ticketOffers"/></div>
    <fieldset><legend>Ticket Link（外部販売・申込先）</legend><div className="field"><label>URL<input aria-describedby={describedBy("ticketUrl")} aria-invalid={invalid("ticketUrl")} name="ticketUrl" type="url" defaultValue={value("ticketUrl")} placeholder="https://…"/></label><FieldError errors={errors} name="ticketUrl"/></div><label>リンク種別<select name="ticketKind" defaultValue={value("ticketKind") || "ticket"}><option value="ticket">ticket</option><option value="registration">registration</option></select></label><div className="field"><label>リンク表示名<input aria-describedby={describedBy("ticketLabel")} aria-invalid={invalid("ticketLabel")} name="ticketLabel" defaultValue={value("ticketLabel")} maxLength={120}/></label><FieldError errors={errors} name="ticketLabel"/></div></fieldset>
    <label><input name="noRegistrationRequired" type="checkbox" defaultChecked={defaults?.noRegistrationRequired === true}/> チケット・登録は不要</label>
    <div className="field"><label>外部リンクURL<input aria-describedby={describedBy("externalUrl")} aria-invalid={invalid("externalUrl")} name="externalUrl" type="url" defaultValue={value("externalUrl")} placeholder="https://…"/></label><FieldError errors={errors} name="externalUrl"/></div>
    <div className="field"><label>外部リンク表示名<input aria-describedby={describedBy("externalLabel")} aria-invalid={invalid("externalLabel")} name="externalLabel" defaultValue={value("externalLabel") || "公式サイト"} maxLength={120}/></label><FieldError errors={errors} name="externalLabel"/></div>
    <fieldset><legend>メイン画像{imageEditable ? "（下書きでは任意、提出時は必須）" : ""}</legend>{imageEditable ? <><div className="field"><label>画像ファイル<input accept="image/jpeg,image/png,image/webp" aria-describedby={describedBy("image")} aria-invalid={invalid("image")} name="image" type="file"/></label><FieldError errors={errors} name="image"/></div><p className="field-help">{hasMainImage ? "現在この Revision には画像が設定されています。新しく選ぶと差し替わります。" : "この Revision にはまだ画像がありません。"}JPEG、PNG、WebP。10MBまで。</p><div className="field"><label>代替テキスト<input aria-describedby={describedBy("imageAlt")} aria-invalid={invalid("imageAlt")} name="imageAlt" defaultValue={value("imageAlt")} maxLength={500}/></label><FieldError errors={errors} name="imageAlt"/></div></> : <p className="field-help">画像と代替テキストは、下書きを作成したあとEventの編集画面から設定します。</p>}</fieldset>
    <div className="field"><label>応募締切（東京都、audition / open_call / residencyで必須）<input aria-describedby={describedBy("applicationDeadline")} aria-invalid={invalid("applicationDeadline")} name="applicationDeadline" type="datetime-local" defaultValue={value("applicationDeadline")}/></label><FieldError errors={errors} name="applicationDeadline"/></div>
  </>;
}
