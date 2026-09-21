"use client";

import { TicketOfferEditor } from "./ticket-offer-editor";
import { eventTypeOptions, type EventTypeGroup } from "@/features/revisions/schema";
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
  canUploadMainImage?: boolean;
  hasMainImage?: boolean;
  defaults?: Record<string, string | boolean | null | undefined>;
  errors?: EventRevisionFieldErrors;
};

const groupNames: Record<EventTypeGroup, string> = {
  watch: "観る",
  participate: "参加する",
  apply: "応募する",
  container: "まとまり",
  other: "その他",
};

const typeGroups = eventTypeOptions.reduce<{ group: EventTypeGroup; options: typeof eventTypeOptions }[]>(
  (groups, option) => {
    const group = groups.find((item) => item.group === option.group);
    if (group) group.options.push(option);
    else groups.push({ group: option.group, options: [option] });
    return groups;
  },
  [],
);

const prefectureNames: Record<string, string> = { TOKYO: "東京都", KANAGAWA: "神奈川県" };

function FieldError({ errors, name }: { errors?: EventRevisionFieldErrors; name: keyof EventRevisionFieldErrors }) {
  const messages = errors?.[name];
  return messages?.length ? <span className="field-error" id={`${name}-error`}>{messages.join(" ")}</span> : null;
}

export function EventFields({ artists, venues, festivalParents, ticketOffers = [], canUploadMainImage = true, hasMainImage = false, defaults, errors }: Props) {
  const value = (name: string) => typeof defaults?.[name] === "string" ? defaults[name] as string : "";
  const invalid = (name: keyof EventRevisionFieldErrors) => Boolean(errors?.[name]?.length);
  const describedBy = (name: keyof EventRevisionFieldErrors) => invalid(name) ? `${name}-error` : undefined;

  return <>
    <fieldset className="form-section">
      <legend>基本</legend>
      <div className="field"><label>Event名<input aria-describedby={describedBy("title")} aria-invalid={invalid("title")} name="title" defaultValue={value("title")} maxLength={200} required/></label><FieldError errors={errors} name="title"/></div>
      <div className="field-row">
        <div className="field"><label>種別<select aria-describedby={describedBy("eventType")} aria-invalid={invalid("eventType")} name="eventType" defaultValue={value("eventType")}><option value="">選択してください（下書きでは空欄可）</option>{typeGroups.map((group) => <optgroup key={group.group} label={groupNames[group.group]}>{group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>)}</select></label><FieldError errors={errors} name="eventType"/></div>
        <label>所属するフェスティバル<select name="proposedParentEventId" defaultValue={value("proposedParentEventId")}><option value="">なし</option>{festivalParents.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
      </div>
      <div className="field"><label>説明<textarea aria-describedby={describedBy("description")} aria-invalid={invalid("description")} name="description" defaultValue={value("description")} rows={6}/></label><FieldError errors={errors} name="description"/></div>
    </fieldset>

    <fieldset className="form-section">
      <legend>日程と会場</legend>
      <p className="field-help">日時は日本時間で入力します。会場が一覧にない場合は、「出演者・会場」から登録を申請してください。</p>
      <div className="field"><label>会場<select aria-describedby={describedBy("venueId")} aria-invalid={invalid("venueId")} name="venueId" defaultValue={value("venueId")}><option value="">選択してください（下書きでは空欄可）</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.prefecture ? `（${prefectureNames[venue.prefecture] ?? venue.prefecture}）` : ""}</option>)}</select></label><FieldError errors={errors} name="venueId"/></div>
      <div className="field-row">
        <div className="field"><label>開始日時<input aria-describedby={describedBy("startsAt")} aria-invalid={invalid("startsAt")} name="startsAt" type="datetime-local" defaultValue={value("startsAt")}/></label><FieldError errors={errors} name="startsAt"/></div>
        <div className="field"><label>終了日時<input aria-describedby={describedBy("endsAt")} aria-invalid={invalid("endsAt")} name="endsAt" type="datetime-local" defaultValue={value("endsAt")}/></label><FieldError errors={errors} name="endsAt"/></div>
      </div>
      <label className="choice"><input name="allDay" type="checkbox" defaultChecked={defaults?.allDay === true}/> 終日</label>
      <div className="field"><label>応募締切<span className="field-help">オーディション・公募・レジデンスでは必須です。</span><input aria-describedby={describedBy("applicationDeadline")} aria-invalid={invalid("applicationDeadline")} name="applicationDeadline" type="datetime-local" defaultValue={value("applicationDeadline")}/></label><FieldError errors={errors} name="applicationDeadline"/></div>
    </fieldset>

    <fieldset className="form-section">
      <legend>出演</legend>
      <div className="field-row">
        <div className="field"><label>出演者<select aria-describedby={describedBy("artistId")} aria-invalid={invalid("artistId")} name="artistId" defaultValue={value("artistId")}><option value="">選択してください（下書きでは空欄可）</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><FieldError errors={errors} name="artistId"/></div>
        <div className="field"><label>役割の表記<input aria-describedby={describedBy("artistRole")} aria-invalid={invalid("artistRole")} name="artistRole" defaultValue={value("artistRole") || "出演"} maxLength={120}/></label><FieldError errors={errors} name="artistRole"/></div>
      </div>
    </fieldset>

    <fieldset className="form-section">
      <legend>参加方法</legend>
      <div className="field"><TicketOfferEditor describedBy={describedBy("ticketOffers")} initialOffers={ticketOffers}/><FieldError errors={errors} name="ticketOffers"/></div>
      <div className="field-row">
        <div className="field"><label>チケット・申込先のURL<input aria-describedby={describedBy("ticketUrl")} aria-invalid={invalid("ticketUrl")} name="ticketUrl" type="url" defaultValue={value("ticketUrl")} placeholder="https://…"/></label><FieldError errors={errors} name="ticketUrl"/></div>
        <label>リンクの種類<select name="ticketKind" defaultValue={value("ticketKind") || "ticket"}><option value="ticket">チケット</option><option value="registration">申込</option></select></label>
      </div>
      <div className="field"><label>リンクの表示名<input aria-describedby={describedBy("ticketLabel")} aria-invalid={invalid("ticketLabel")} name="ticketLabel" defaultValue={value("ticketLabel")} maxLength={120} placeholder="チケットを購入する"/></label><FieldError errors={errors} name="ticketLabel"/></div>
      <label className="choice"><input name="noRegistrationRequired" type="checkbox" defaultChecked={defaults?.noRegistrationRequired === true}/> 申込は不要（当日そのまま参加できる）</label>
    </fieldset>

    <fieldset className="form-section">
      <legend>問い合わせ先</legend>
      <p className="field-help">審査へ提出するときに必要です。公式サイト・SNSはURL、メールはアドレスを入れます。</p>
      <div className="field-row">
        <div className="field"><label>問い合わせの手段<select aria-describedby={describedBy("contactKind")} aria-invalid={invalid("contactKind")} name="contactKind" defaultValue={value("contactKind")}><option value="">選択してください</option><option value="website">公式サイト</option><option value="social">SNS</option><option value="email">メールアドレス</option></select></label><FieldError errors={errors} name="contactKind"/></div>
        <div className="field"><label>問い合わせ先<input aria-describedby={describedBy("contactValue")} aria-invalid={invalid("contactValue")} name="contactValue" defaultValue={value("contactValue")} maxLength={500} placeholder="https://… または contact@example.com"/></label><FieldError errors={errors} name="contactValue"/></div>
      </div>
    </fieldset>

    <fieldset className="form-section">
      <legend>関連リンク</legend>
      <div className="field-row">
        <div className="field"><label>URL<input aria-describedby={describedBy("externalUrl")} aria-invalid={invalid("externalUrl")} name="externalUrl" type="url" defaultValue={value("externalUrl")} placeholder="https://…"/></label><FieldError errors={errors} name="externalUrl"/></div>
        <div className="field"><label>表示名<input aria-describedby={describedBy("externalLabel")} aria-invalid={invalid("externalLabel")} name="externalLabel" defaultValue={value("externalLabel") || "公式サイト"} maxLength={120}/></label><FieldError errors={errors} name="externalLabel"/></div>
      </div>
    </fieldset>

    <fieldset className="form-section">
      <legend>メイン画像（任意）</legend>
      {canUploadMainImage ? <>
        <p className="field-help">画像がなくても公開できます。登録する場合は、画像の内容を伝える代替テキストが必要です。{hasMainImage ? "この版には画像が設定されています。新しく選ぶと差し替わります。" : "この版にはまだ画像がありません。"}</p>
        <div className="field"><label>画像ファイル<input accept="image/jpeg,image/png,image/webp" aria-describedby={describedBy("image")} aria-invalid={invalid("image")} name="image" type="file"/></label><FieldError errors={errors} name="image"/></div>
        <p className="field-help">JPEG、PNG、WebP。10MBまで。</p>
        <div className="field"><label>代替テキスト<input aria-describedby={describedBy("imageAlt")} aria-invalid={invalid("imageAlt")} name="imageAlt" defaultValue={value("imageAlt")} maxLength={500}/></label><FieldError errors={errors} name="imageAlt"/></div>
      </> : <p className="field-help">画像と代替テキストは、下書きを作成したあとに編集画面から設定します。</p>}
    </fieldset>
  </>;
}
