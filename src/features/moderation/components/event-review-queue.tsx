import Link from "next/link";

import {
  approveEventCancellation,
  approveEventRevision,
  requestEventCancellationChanges,
  requestEventRevisionChanges,
} from "@/features/moderation/commands";
import { requirePlatformAdmin } from "@/features/moderation/policy";
import {
  getEventReviewQueue,
  getReviewTicketOffers,
} from "@/features/moderation/queries";
import {
  eventTypeLabel,
  isEventType,
  ticketOfferPrice,
  type TicketOfferInput,
  type TicketPriceType,
} from "@/features/revisions/schema";
import { formatTokyoDateTime } from "@/lib/datetime";
import { DefinitionRows } from "@/ui/definition-rows";
import { EmptyState } from "@/ui/empty-state";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { StateLabel } from "@/ui/state-label";
import { mainContentId } from "@/ui/skip-link";

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
  const [
    { data: revisions, error: revisionError },
    { data: cancellations, error: cancellationError },
  ] = await getEventReviewQueue(supabase);
  if (revisionError || cancellationError) throw new Error("Event review queue could not be loaded.");

  const revisionIds = (revisions ?? []).map((revision) => revision.id);
  const { data: ticketOffers, error: ticketOfferError } =
    await getReviewTicketOffers(supabase, revisionIds);
  if (ticketOfferError) throw new Error("Ticket offers for the review queue could not be loaded.");

  return (
    <main id={mainContentId} className="container-app app-main">
      <AppPageHead
        description={
          <>
            審査で確認するのは記載の形式と権利だけで、内容の良し悪しは判断しません（掲載基準）。
            承認・差し戻しは監査記録つきで行われ、改訂の承認時だけ公開版が切り替わります。
            掲載の取り下げ要請は<Link className="text-link" href="/admin/withdrawals">取り下げ</Link>から処理します。
          </>
        }
        title="Event公開・中止の審査"
      />

      {params.error && errorMessages[params.error] ? <Notice tone="error">{errorMessages[params.error]}</Notice> : null}
      {params.reviewed && reviewedMessages[params.reviewed] ? <Notice tone="success">{reviewedMessages[params.reviewed]}</Notice> : null}

      <Section
        aside={<span className="tabular muted">{revisions?.length ?? 0}件</span>}
        id="queue-revisions"
        rule
        size="small"
        title="公開・更新の申請"
      >
        {revisions?.length ? (
          <div className="panels">
            {revisions.map((revision) => {
              const event = Array.isArray(revision.events) ? revision.events[0] : revision.events;
              const revisionTicketOffers = (ticketOffers ?? []).filter((offer) => offer.event_revision_id === revision.id);
              return (
                <article className="review-item" key={revision.id}>
                  <div className="review-item-head">
                    <div className="review-item-title">
                      <span className="review-item-sub">
                        {organizationName(event?.organizations as OrganizationValue)} · 提出 {formatTokyoDateTime(revision.created_at)}
                      </span>
                      <h2>{revision.title}</h2>
                    </div>
                    <StateLabel tone="dashed">審査中</StateLabel>
                  </div>
                  <DefinitionRows
                    rows={[
                      {
                        key: "type",
                        term: "種別",
                        detail: revision.event_type && isEventType(revision.event_type) ? eventTypeLabel(revision.event_type) : "未設定",
                      },
                      {
                        key: "deadline",
                        term: "応募締切",
                        detail: revision.application_deadline ? formatTokyoDateTime(revision.application_deadline) : "なし",
                      },
                      { key: "description", term: "説明", detail: revision.description ?? "—" },
                      {
                        key: "offers",
                        term: "料金",
                        detail: revisionTicketOffers.length ? (
                          <ul aria-label="審査対象の料金" className="rows">
                            {revisionTicketOffers.map((offer) => {
                              const typedOffer: Omit<TicketOfferInput, "display_order"> = {
                                ...offer,
                                price_type: offer.price_type as TicketPriceType,
                              };
                              return (
                                <li key={offer.display_order}>
                                  {offer.label ? `${offer.label}　` : null}
                                  {ticketOfferPrice(typedOffer)}
                                  {offer.notes ? <span className="muted">　{offer.notes}</span> : null}
                                </li>
                              );
                            })}
                          </ul>
                        ) : "料金の登録なし（申込リンクまたは申込不要で提出）",
                      },
                    ]}
                  />
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
            })}
          </div>
        ) : <EmptyState>審査待ちのEvent改訂はありません。</EmptyState>}
      </Section>

      <Section
        aside={<span className="tabular muted">{cancellations?.length ?? 0}件</span>}
        id="queue-cancellations"
        rule
        size="small"
        title="中止の申請"
      >
        {cancellations?.length ? (
          <div className="panels">
            {cancellations.map((request) => {
              const event = Array.isArray(request.events) ? request.events[0] : request.events;
              return (
                <article className="review-item" key={request.id}>
                  <div className="review-item-head">
                    <div className="review-item-title">
                      <span className="review-item-sub">
                        {organizationName(event?.organizations as OrganizationValue)} · 申請 {formatTokyoDateTime(request.created_at)}
                      </span>
                      <h2>Eventの中止申請</h2>
                    </div>
                    <StateLabel tone="dashed">審査中</StateLabel>
                  </div>
                  <DefinitionRows rows={[{ key: "reason", term: "申請理由", detail: request.requested_reason }]} />
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
            })}
          </div>
        ) : <EmptyState>審査待ちの中止申請はありません。</EmptyState>}
      </Section>
    </main>
  );
}
