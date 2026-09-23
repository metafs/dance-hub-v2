import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { formatTokyoDateTime } from "@/lib/datetime";
import { DefinitionRows } from "@/ui/definition-rows";
import { EmptyState } from "@/ui/empty-state";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { StateLabel } from "@/ui/state-label";

import { markEventAsProxy, resolveListingRequest } from "@/features/listing-requests/commands";

import { restoreEvent, withdrawEvent } from "./actions";

const errorMessages: Record<string, string> = {
  "event-required": "対象のEvent IDを入力してください。",
  "reason-required": "理由を入力してください。",
  "withdrawal-failed": "取り下げできませんでした。Event IDと、すでに取り下げ済みでないかを確認してください。",
  "restoration-failed": "復帰できませんでした。取り下げ済みのEventかどうかを確認してください。",
};

const doneMessages: Record<string, string> = {
  withdrawn: "Eventを取り下げました。一覧・検索・直URLのいずれからも到達できません。",
  restored: "Eventを復帰しました。公開状態に戻っています。",
};

type OrganizationValue = { name: string } | { name: string }[] | null;

function organizationName(value: OrganizationValue) {
  if (Array.isArray(value)) return value[0]?.name ?? "不明なOrganization";
  return value?.name ?? "不明なOrganization";
}

export const metadata: Metadata = { title: "掲載の依頼と取り下げ" };

export default async function WithdrawalQueue({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string; requestError?: string; requestResolved?: string; proxyError?: string; proxyMarked?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePlatformAdmin();

  // A Platform Admin still reads withdrawn Events: ADR-0018 keeps the record,
  // and without this list a withdrawal made in error would be invisible to the
  // person who has to undo it.
  const { data: withdrawn, error } = await supabase
    .from("events")
    // Two foreign keys reach event_revisions from events, so the embed names
    // the published-pointer one explicitly.
    .select("id, withdrawn_at, withdrawal_reason, organizations(name), event_revisions!events_published_revision_fk(title)")
    .not("withdrawn_at", "is", null)
    .order("withdrawn_at", { ascending: false });
  if (error) throw new Error("Withdrawn events could not be loaded.");
  const { data: requests, error: requestsError } = await supabase
    .from("listing_requests")
    .select("id, event_id, kind, requester_contact, message, created_at, events!listing_requests_event_id_fkey(event_revisions!events_published_revision_fk(title))")
    .is("resolved_at", null)
    .order("created_at");
  if (requestsError) throw new Error("Listing requests could not be loaded.");

  return (
    <main className="container-app app-main">
      <AppPageHead
        description="取り下げは削除ではなく非公開化です。一覧・検索・直URLのいずれからも到達できなくなり、記録と承認履歴は残ります。判断の基準は掲載基準Fです。"
        title="掲載の依頼と取り下げ"
      />

      {params.error && errorMessages[params.error] ? <Notice tone="error">{errorMessages[params.error]}</Notice> : null}
      {params.done && doneMessages[params.done] ? <Notice tone="success">{doneMessages[params.done]}</Notice> : null}
      {params.requestResolved ? <Notice tone="success">依頼を対応済みにしました。</Notice> : null}
      {params.requestError ? <Notice tone="error">依頼を更新できませんでした。</Notice> : null}
      {params.proxyMarked ? <Notice tone="success">Eventを代理入力として識別しました。</Notice> : null}
      {params.proxyError ? <Notice tone="error">代理入力として識別できませんでした。Event ID と、画像がないことを確認してください。</Notice> : null}

      <Section
        aside={<span className="tabular muted">{requests?.length ?? 0}件</span>}
        id="listing-requests"
        rule
        size="small"
        title="受付待ちの依頼"
      >
        <p className="field-help">公開ページの依頼フォームから届いた、掲載の削除・修正の依頼です。削除は理由を問わず応じます（掲載基準F）。</p>
        {requests?.length ? (
          <div className="panels">
            {requests.map((request) => {
              const event = Array.isArray(request.events) ? request.events[0] : request.events;
              const revision = event?.event_revisions
                ? (Array.isArray(event.event_revisions) ? event.event_revisions[0] : event.event_revisions)
                : null;
              return (
                <article className="review-item" key={request.id}>
                  <div className="review-item-head">
                    <div className="review-item-title">
                      <span className="review-item-sub tabular">受付 {formatTokyoDateTime(request.created_at)}</span>
                      <h2>{revision?.title ?? "公開Event"}</h2>
                    </div>
                    <StateLabel tone={request.kind === "withdrawal" ? "solid" : "outline"}>
                      {request.kind === "withdrawal" ? "掲載削除" : "情報修正"}
                    </StateLabel>
                  </div>
                  <DefinitionRows
                    rows={[
                      { key: "id", term: "Event ID", detail: <code>{request.event_id}</code> },
                      { key: "contact", term: "連絡先", detail: request.requester_contact },
                      { key: "message", term: "依頼内容", detail: request.message },
                    ]}
                  />
                  {request.kind === "withdrawal" ? (
                    <a className="text-link" href="#withdraw-event-id">下の「取り下げる」で処理する</a>
                  ) : null}
                  <form action={resolveListingRequest} className="review-form">
                    <input name="requestId" type="hidden" value={request.id} />
                    <label>対応メモ（内部記録）<textarea name="note" rows={2} /></label>
                    <div><button className="button" type="submit">対応済みにする</button></div>
                  </form>
                </article>
              );
            })}
          </div>
        ) : <EmptyState>受付待ちの依頼はありません。</EmptyState>}
      </Section>

      <Section id="withdraw" rule size="small" title="取り下げる">
        <form action={withdrawEvent} className="form-panel">
          <p className="field-help">
            取り下げの依頼は公開ページのURLとともに届きます。URLの末尾のIDを貼り付けてください。
            中止とは別の操作です。中止は公開を続けたまま「中止」と表示します。
          </p>
          <div className="field">
            <label htmlFor="withdraw-event-id">Event ID</label>
            <input id="withdraw-event-id" name="eventId" required placeholder="00000000-0000-0000-0000-000000000000" />
          </div>
          <div className="field">
            <label htmlFor="withdraw-reason">取り下げ理由（内部記録。公開されません）</label>
            <textarea id="withdraw-reason" name="reason" required rows={3} />
          </div>
          <div><button className="button button-danger" type="submit">取り下げる</button></div>
        </form>
      </Section>

      <Section id="proxy-listing" rule size="small" title="代理入力として識別する">
        <form action={markEventAsProxy} className="form-panel">
          <p className="field-help">
            公開情報を転記した、画像を持たないEventだけを代理入力として記録します。以後は画像を追加できず、公開ページに修正の依頼先が表示されます。
          </p>
          <div className="field">
            <label htmlFor="proxy-event-id">Event ID</label>
            <input id="proxy-event-id" name="eventId" required />
          </div>
          <div><button className="button" type="submit">代理入力として識別</button></div>
        </form>
      </Section>

      <Section
        aside={<span className="tabular muted">{withdrawn?.length ?? 0}件</span>}
        id="withdrawn"
        rule
        size="small"
        title="取り下げ済み"
      >
        {withdrawn?.length ? (
          <div className="panels">
            {withdrawn.map((event) => {
              const revision = Array.isArray(event.event_revisions) ? event.event_revisions[0] : event.event_revisions;
              return (
                <article className="review-item" key={event.id}>
                  <div className="review-item-head">
                    <div className="review-item-title">
                      <span className="review-item-sub">{organizationName(event.organizations as OrganizationValue)}</span>
                      <h2>{revision?.title ?? "公開された版なし"}</h2>
                    </div>
                    <StateLabel tone="solid">取り下げ済み</StateLabel>
                  </div>
                  <DefinitionRows
                    rows={[
                      { key: "id", term: "Event ID", detail: <code>{event.id}</code> },
                      { key: "at", term: "取り下げ日時", detail: event.withdrawn_at ? formatTokyoDateTime(event.withdrawn_at) : "—" },
                      { key: "reason", term: "理由", detail: event.withdrawal_reason ?? "—" },
                    ]}
                  />
                  <form action={restoreEvent} className="review-form">
                    <input name="eventId" type="hidden" value={event.id} />
                    <div className="field">
                      <label htmlFor={`restore-reason-${event.id}`}>復帰理由</label>
                      <textarea id={`restore-reason-${event.id}`} name="reason" required rows={2} />
                    </div>
                    <div><button className="button" type="submit">復帰する</button></div>
                  </form>
                </article>
              );
            })}
          </div>
        ) : <EmptyState>取り下げ済みのEventはありません。</EmptyState>}
      </Section>
    </main>
  );
}
