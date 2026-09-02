import Link from "next/link";
import { notFound } from "next/navigation";

import { EventRevisionForm } from "@/components/event-revision-form";
import { requireOrganizationCapability } from "@/lib/auth/authorization";
import { hasOrganizationCapability } from "@/lib/auth/roles";

import {
  createNextEventRevisionDraft,
  requestEventCancellation,
  resubmitEventCancellation,
} from "../actions";

function localTokyo(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

const errors: Record<string, string> = {
  "save-failed": "このRevisionは編集できません。審査中または承認済みの可能性があります。",
  "content-save": "関連情報を保存できませんでした。",
  "not-ready": "提出条件を満たしていません。説明、種別、Artist、Ticket Offer／Ticket Link／申込不要、メイン画像、必要な日時を確認してください。",
  "invalid-input": "日時、URL、画像メタデータを確認してください。",
  "revision-create": "新しいRevisionを作成できませんでした。未完了のRevisionが残っていないか確認してください。",
  "cancellation-request": "中止申請を送信できませんでした。",
  "cancellation-resubmit": "中止申請を再提出できませんでした。",
};

export default async function EventEditPage({ params, searchParams }: { params: Promise<{ organizationId: string; eventId: string }>; searchParams: Promise<{ revision?: string; created?: string; saved?: string; submitted?: string; cancellation?: string; error?: string }> }) {
  const { organizationId, eventId } = await params;
  const query = await searchParams;
  const { supabase, role } = await requireOrganizationCapability(organizationId, "editEvents");
  const [{ data: revisions }, { data: event }, { data: cancellationRequest }, { data: festivalRevisions }] = await Promise.all([
    supabase.from("event_revisions").select("id, event_id, title, description, event_type, application_deadline, proposed_parent_event_id, no_registration_required, status, created_at").eq("event_id", eventId).order("created_at", { ascending: false }),
    supabase.from("events").select("id, published_revision_id, cancelled_at").eq("id", eventId).maybeSingle(),
    supabase.from("event_cancellation_requests").select("id, status, requested_reason, decision_reason, updated_at").eq("event_id", eventId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("event_revisions").select("event_id, title").eq("event_type", "festival").in("status", ["draft", "in_review", "changes_requested", "approved"]),
  ]);
  const revision = query.revision ? revisions?.find((candidate) => candidate.id === query.revision) : revisions?.[0];
  if (!revision) notFound();
  const [{ data: artists }, { data: venues }, { data: credit }, { data: schedule }, { data: ticketOffers }, { data: ticket }, { data: link }, { data: image }] = await Promise.all([
    supabase.from("artists").select("id, name").order("name").limit(100),
    supabase.from("venues").select("id, name, prefecture").order("name").limit(100),
    supabase.from("event_artists").select("artist_id, role").eq("event_revision_id", revision.id).order("display_order").limit(1).maybeSingle(),
    supabase.from("event_schedules").select("venue_id, starts_at, ends_at, all_day").eq("event_revision_id", revision.id).order("starts_at").limit(1).maybeSingle(),
    supabase.from("event_ticket_offers").select("id, price_type, label, currency, amount_minor, min_amount_minor, max_amount_minor, notes").eq("event_revision_id", revision.id).order("display_order"),
    supabase.from("event_ticket_links").select("kind, label, url").eq("event_revision_id", revision.id).order("display_order").limit(1).maybeSingle(),
    supabase.from("event_links").select("label, url").eq("event_revision_id", revision.id).order("display_order").limit(1).maybeSingle(),
    supabase.from("event_media").select("object_key, content_type, alt_text").eq("event_revision_id", revision.id).eq("is_main", true).maybeSingle(),
  ]);
  const defaults = { title: revision.title, description: revision.description, eventType: revision.event_type, applicationDeadline: localTokyo(revision.application_deadline), proposedParentEventId: revision.proposed_parent_event_id, noRegistrationRequired: revision.no_registration_required, artistId: credit?.artist_id, artistRole: credit?.role, venueId: schedule?.venue_id, startsAt: localTokyo(schedule?.starts_at ?? null), endsAt: localTokyo(schedule?.ends_at ?? null), allDay: schedule?.all_day, ticketKind: ticket?.kind, ticketUrl: ticket?.url, ticketLabel: ticket?.label, externalUrl: link?.url, externalLabel: link?.label, imageObjectKey: image?.object_key, imageContentType: image?.content_type, imageAlt: image?.alt_text };
  const editable = revision.status === "draft" || revision.status === "changes_requested";
  const canRequestCancellation = hasOrganizationCapability(role, "requestCancellation");
  const canCreateNextDraft = Boolean(event?.published_revision_id) && !event?.cancelled_at && !revisions?.some((candidate) => ["draft", "in_review", "changes_requested"].includes(candidate.status));
  return <main className="workspace-main narrow-main"><Link className="back-link" href={`/workspace/${organizationId}/events`}>← Event一覧へ戻る</Link><section className="hero-card"><div><span className="status">{revision.status}</span><p className="eyebrow">Event Revision</p><h1>{revision.title}</h1><p className="lede">日時入力は東京都（Asia/Tokyo）として保存します。提出後は審査完了まで編集できません。</p></div></section>{query.created || query.saved || query.submitted || query.cancellation ? <p className="notice notice-success">{query.submitted ? "審査へ提出しました。" : query.cancellation ? "中止申請をPlatform Adminの審査へ送りました。" : "下書きを保存しました。"}</p> : null}{query.error ? <p className="notice notice-error" role="alert">{errors[query.error] ?? "保存できませんでした。"}</p> : null}{editable ? <EventRevisionForm organizationId={organizationId} eventId={eventId} revisionId={revision.id} artists={artists ?? []} venues={venues ?? []} festivalParents={(festivalRevisions ?? []).filter((parent) => parent.event_id !== eventId).map((parent) => ({ id: parent.event_id, title: parent.title }))} ticketOffers={(ticketOffers ?? []).map((offer) => ({ key: offer.id, priceType: offer.price_type, label: offer.label, currency: offer.currency, amountMinor: offer.amount_minor, minAmountMinor: offer.min_amount_minor, maxAmountMinor: offer.max_amount_minor, notes: offer.notes }))} defaults={defaults}/> : <p className="notice">このRevisionは現在編集不可です。Platform Adminの審査結果を待ってください。</p>}{canCreateNextDraft ? <section className="section-block"><h2>公開済みEventを更新</h2><p>現在公開中の内容をコピーして、新しい下書きRevisionを作成します。公開中のEventはそのまま表示され続けます。</p><form action={createNextEventRevisionDraft}><input name="organizationId" type="hidden" value={organizationId}/><input name="eventId" type="hidden" value={eventId}/><button className="button button-secondary">次のRevisionを作成</button></form></section> : null}{event?.published_revision_id && canRequestCancellation && !event.cancelled_at ? <section className="section-block"><h2>中止申請</h2>{cancellationRequest ? <div className="notice"><p><strong>{cancellationRequest.status}</strong></p><p>申請理由: {cancellationRequest.requested_reason}</p>{cancellationRequest.decision_reason ? <p>審査コメント: {cancellationRequest.decision_reason}</p> : null}{cancellationRequest.status === "changes_requested" ? <form action={resubmitEventCancellation} className="form-stack"><input name="organizationId" type="hidden" value={organizationId}/><input name="eventId" type="hidden" value={eventId}/><input name="requestId" type="hidden" value={cancellationRequest.id}/><label>再提出する理由<textarea name="reason" defaultValue={cancellationRequest.requested_reason} rows={3} required maxLength={2000}/></label><button className="button button-danger">中止申請を再提出</button></form> : null}</div> : <form action={requestEventCancellation} className="form-stack"><input name="organizationId" type="hidden" value={organizationId}/><input name="eventId" type="hidden" value={eventId}/><label>中止理由<textarea name="reason" rows={3} required maxLength={2000}/></label><button className="button button-danger">中止を申請</button></form>}</section> : null}</main>;
}
