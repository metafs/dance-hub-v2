import Link from "next/link";

import { logout } from "@/app/login/actions";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { ticketOfferPrice, type TicketOfferInput, type TicketPriceType } from "@/lib/events/ticket-offers";

import {
  approveEventCancellation,
  approveEventRevision,
  requestEventCancellationChanges,
  requestEventRevisionChanges,
} from "./actions";

const errorMessages: Record<string, string> = {
  "invalid-review": "審査対象を特定できませんでした。",
  "review-reason-required": "差し戻し理由を入力してください。",
  "public-reason-required": "一般公開する中止理由を入力してください。",
  "revision-review-failed": "イベント改訂を審査できませんでした。状態と必須項目を確認してください。",
  "cancellation-review-failed": "中止申請を審査できませんでした。現在の状態を確認してください。",
};

const reviewedMessages: Record<string, string> = {
  "revision-approved": "イベント改訂を承認し、公開版を更新しました。",
  "revision-changes-requested": "イベント改訂を差し戻しました。",
  "cancellation-approved": "イベントの中止を承認し、一般公開ページに反映しました。",
  "cancellation-changes-requested": "中止申請を差し戻しました。",
};

type OrganizationValue = { name: string } | { name: string }[] | null;

function organizationName(value: OrganizationValue) {
  if (Array.isArray(value)) return value[0]?.name ?? "不明なOrganization";
  return value?.name ?? "不明なOrganization";
}

export default async function EventReviewQueue({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reviewed?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePlatformAdmin();
  const [{ data: revisions, error: revisionError }, { data: cancellations, error: cancellationError }] = await Promise.all([
    supabase
      .from("event_revisions")
      .select("id, event_id, title, description, event_type, application_deadline, created_at, events!inner(owner_organization_id, organizations(name))")
      .eq("status", "in_review")
      .order("created_at"),
    supabase
      .from("event_cancellation_requests")
      .select("id, event_id, requested_reason, created_at, events!inner(owner_organization_id, organizations(name))")
      .eq("status", "in_review")
      .order("created_at"),
  ]);
  if (revisionError || cancellationError) throw new Error("Event review queue could not be loaded.");

  const revisionIds = (revisions ?? []).map((revision) => revision.id);
  const { data: ticketOffers, error: ticketOfferError } = revisionIds.length
    ? await supabase
      .from("event_ticket_offers")
      .select("event_revision_id, price_type, label, currency, amount_minor, min_amount_minor, max_amount_minor, notes, display_order")
      .in("event_revision_id", revisionIds)
      .order("display_order")
    : { data: [], error: null };
  if (ticketOfferError) throw new Error("Ticket offers for the review queue could not be loaded.");

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="wordmark" href="/workspace">DANCE HUB</Link>
        <form action={logout}>
          <button className="button button-quiet" type="submit">ログアウト</button>
        </form>
      </header>
      <main className="workspace-main">
        <Link className="back-link" href="/workspace">← Workspaceへ戻る</Link>
        <section className="hero-card">
          <div>
            <p className="eyebrow">Platform Admin</p>
            <h1>Event 公開・中止審査</h1>
            <p className="lede">承認・差し戻しは監査記録つきのDB遷移で行います。改訂承認時だけ公開版が切り替わります。</p>
          </div>
          <span className="queue-count">{(revisions?.length ?? 0) + (cancellations?.length ?? 0)}件</span>
        </section>

        {params.error && errorMessages[params.error] ? <p className="notice notice-error" role="alert">{errorMessages[params.error]}</p> : null}
        {params.reviewed && reviewedMessages[params.reviewed] ? <p className="notice notice-success">{reviewedMessages[params.reviewed]}</p> : null}

        <section className="review-list" aria-label="公開待ちEvent改訂">
          <div className="section-heading">
            <p className="eyebrow">Revision queue</p>
            <h2>公開待ちの改訂</h2>
          </div>
          {revisions?.length ? revisions.map((revision) => {
            const event = Array.isArray(revision.events) ? revision.events[0] : revision.events;
            const revisionTicketOffers = (ticketOffers ?? []).filter((offer) => offer.event_revision_id === revision.id);
            return (
              <article className="review-card" key={revision.id}>
                <div className="review-card-header">
                  <div><p className="eyebrow">{organizationName(event?.organizations as OrganizationValue)}</p><h2>{revision.title}</h2></div>
                  <span className="status status-submitted">in review</span>
                </div>
                <dl className="details-list">
                  <div><dt>種別</dt><dd>{revision.event_type ?? "未設定"}</dd></div>
                  <div><dt>申込締切</dt><dd>{revision.application_deadline ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(revision.application_deadline)) : "なし"}</dd></div>
                  <div><dt>説明</dt><dd>{revision.description ?? "—"}</dd></div>
                </dl>
                {revisionTicketOffers.length ? <div className="ticket-offer-list" aria-label="審査対象の料金">{revisionTicketOffers.map((offer) => {
                  const typedOffer: Omit<TicketOfferInput, "display_order"> = { ...offer, price_type: offer.price_type as TicketPriceType, amount_minor: offer.amount_minor == null ? null : String(offer.amount_minor), min_amount_minor: offer.min_amount_minor == null ? null : String(offer.min_amount_minor), max_amount_minor: offer.max_amount_minor == null ? null : String(offer.max_amount_minor) };
                  return <article className="ticket-offer-public" key={offer.display_order}><strong>{offer.label || ticketOfferPrice(typedOffer)}</strong>{offer.label ? <span>{ticketOfferPrice(typedOffer)}</span> : null}{offer.notes ? <p>{offer.notes}</p> : null}</article>;
                })}</div> : <p className="field-help">Ticket Offerなし（Ticket Linkまたは申込不要で提出）</p>}
                <form className="review-form">
                  <input name="eventId" type="hidden" value={revision.event_id} />
                  <input name="targetId" type="hidden" value={revision.id} />
                  <label>審査メモ（承認時は任意、差し戻し時は必須）<textarea name="reason" rows={3} /></label>
                  <div className="button-row">
                    <button className="button button-primary" formAction={approveEventRevision} type="submit">承認・公開</button>
                    <button className="button button-danger" formAction={requestEventRevisionChanges} type="submit">変更を依頼</button>
                  </div>
                </form>
              </article>
            );
          }) : <div className="empty-state">公開待ちのEvent改訂はありません。</div>}
        </section>

        <section className="review-list" aria-label="中止申請の審査">
          <div className="section-heading">
            <p className="eyebrow">Cancellation queue</p>
            <h2>中止申請</h2>
          </div>
          {cancellations?.length ? cancellations.map((request) => {
            const event = Array.isArray(request.events) ? request.events[0] : request.events;
            return (
              <article className="review-card" key={request.id}>
                <div className="review-card-header">
                  <div><p className="eyebrow">{organizationName(event?.organizations as OrganizationValue)}</p><h2>Event の中止申請</h2></div>
                  <span className="status status-submitted">in review</span>
                </div>
                <dl className="details-list"><div><dt>申請理由</dt><dd>{request.requested_reason}</dd></div></dl>
                <form className="review-form">
                  <input name="eventId" type="hidden" value={request.event_id} />
                  <input name="targetId" type="hidden" value={request.id} />
                  <label>一般公開する中止理由 / 差し戻し理由<textarea name="reason" required rows={3} /></label>
                  <div className="button-row">
                    <button className="button button-primary" formAction={approveEventCancellation} type="submit">中止を承認</button>
                    <button className="button button-danger" formAction={requestEventCancellationChanges} type="submit">変更を依頼</button>
                  </div>
                </form>
              </article>
            );
          }) : <div className="empty-state">審査待ちの中止申請はありません。</div>}
        </section>
      </main>
    </div>
  );
}
