import Link from "next/link";

import { requireOrganizationCapability } from "@/lib/auth/authorization";
import { TicketOfferEditor } from "@/components/ticket-offer-editor";
import type { TicketOfferDraft } from "@/lib/events/ticket-offers";

import { createEventDraft } from "./actions";

const errorMessages: Record<string, string> = {
  "create-failed": "下書きを作成できませんでした。権限と入力内容を確認してください。",
  "invalid-input": "日時、URL、画像メタデータの入力内容を確認してください。",
};

export default async function EventListPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { organizationId } = await params;
  const query = await searchParams;
  const { organization, supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const [{ data: revisions }, { data: artists }, { data: venues }] = await Promise.all([
    supabase.from("event_revisions").select("id, event_id, title, event_type, status, created_at").order("created_at", { ascending: false }),
    supabase.from("artists").select("id, name").order("name").limit(100),
    supabase.from("venues").select("id, name, prefecture").order("name").limit(100),
  ]);

  return <main className="workspace-main">
    <Link className="back-link" href={`/workspace/${organizationId}`}>← Workspaceへ戻る</Link>
    <section className="hero-card"><div><p className="eyebrow">Event workflow</p><h1>Event Draft</h1><p className="lede">{organization.name} のEventを下書きとして作成します。公開にはPlatform Adminの承認が必要です。</p></div></section>
    {query.error ? <p className="notice notice-error" role="alert">{errorMessages[query.error] ?? "保存できませんでした。"}</p> : null}
    <section className="section-block"><h2>作成済みのRevision</h2><div className="card-grid">{revisions?.map((revision) => <article className="entity-card" key={revision.id}><span className="status">{revision.status}</span><h3>{revision.title}</h3><Link className="text-link" href={`/workspace/${organizationId}/events/${revision.event_id}?revision=${revision.id}`}>編集する →</Link></article>)}</div></section>
    <section className="section-block"><form action={createEventDraft} className="form-card form-stack"><input name="organizationId" type="hidden" value={organizationId}/><h2>新しいEventを作成</h2><EventFields artists={artists ?? []} venues={venues ?? []} festivalParents={(revisions ?? []).filter((revision) => revision.event_type === "festival").map((revision) => ({ id: revision.event_id, title: revision.title }))}/><button className="button button-primary">下書きを作成</button></form></section>
  </main>;
}

export function EventFields({ artists, venues, festivalParents, ticketOffers = [], defaults }: { artists: { id: string; name: string }[]; venues: { id: string; name: string; prefecture?: string }[]; festivalParents: { id: string; title: string }[]; ticketOffers?: TicketOfferDraft[]; defaults?: Record<string, string | boolean | null> }) {
  const value = (name: string) => typeof defaults?.[name] === "string" ? defaults[name] as string : "";
  return <>
    <label>Event名<input name="title" defaultValue={value("title")} maxLength={200} required/></label>
    <label>説明<textarea name="description" defaultValue={value("description")} rows={5}/></label>
    <label>種別<select name="eventType" defaultValue={value("eventType")}><option value="">下書きでは未選択</option>{["performance", "open_studio", "talk", "workshop", "audition", "open_call", "residency", "festival", "other"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
    <label>Festival親Event（子Eventのみ）<select name="proposedParentEventId" defaultValue={value("proposedParentEventId")}><option value="">指定しない</option>{festivalParents.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
    <label>Artist（canonical）<select name="artistId" defaultValue={value("artistId")}><option value="">下書きでは未選択</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
    <label>クレジット表記<input name="artistRole" defaultValue={value("artistRole") || "出演"} maxLength={120}/></label>
    <label>会場（canonical）<select name="venueId" defaultValue={value("venueId")}><option value="">下書きでは未選択</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.prefecture ? `（${venue.prefecture}）` : ""}</option>)}</select></label>
    <label>開始日時（東京都）<input name="startsAt" type="datetime-local" defaultValue={value("startsAt")}/></label>
    <label>終了日時（東京都）<input name="endsAt" type="datetime-local" defaultValue={value("endsAt")}/></label>
    <label><input name="allDay" type="checkbox" defaultChecked={defaults?.allDay === true}/> 終日</label>
    <TicketOfferEditor initialOffers={ticketOffers}/>
    <fieldset><legend>Ticket Link（外部販売・申込先）</legend><label>URL<input name="ticketUrl" type="url" defaultValue={value("ticketUrl")} placeholder="https://…"/></label><label>種別<select name="ticketKind" defaultValue={value("ticketKind") || "ticket"}><option value="ticket">ticket</option><option value="registration">registration</option></select></label><label>リンク表示名<input name="ticketLabel" defaultValue={value("ticketLabel")} maxLength={120}/></label></fieldset>
    <label><input name="noRegistrationRequired" type="checkbox" defaultChecked={defaults?.noRegistrationRequired === true}/> チケット・登録は不要</label>
    <label>外部リンクURL<input name="externalUrl" type="url" defaultValue={value("externalUrl")} placeholder="https://…"/></label>
    <label>外部リンク表示名<input name="externalLabel" defaultValue={value("externalLabel") || "公式サイト"} maxLength={120}/></label>
    <fieldset><legend>メイン画像メタデータ（下書きでは任意、提出時は必須）</legend><label>object key<input name="imageObjectKey" defaultValue={value("imageObjectKey")} maxLength={1024} placeholder="events/example/cover.jpg"/></label><label>content type<input name="imageContentType" defaultValue={value("imageContentType")} placeholder="image/jpeg"/></label><label>代替テキスト<input name="imageAlt" defaultValue={value("imageAlt")} maxLength={500}/></label></fieldset>
    <label>応募締切（東京都、audition / open_call / residencyで必須）<input name="applicationDeadline" type="datetime-local" defaultValue={value("applicationDeadline")}/></label>
  </>;
}
