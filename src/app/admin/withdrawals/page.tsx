import Link from "next/link";

import { logout } from "@/app/login/actions";
import { requirePlatformAdmin } from "@/lib/auth/authorization";

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

const dateTime = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Tokyo",
});

type OrganizationValue = { name: string } | { name: string }[] | null;

function organizationName(value: OrganizationValue) {
  if (Array.isArray(value)) return value[0]?.name ?? "不明なOrganization";
  return value?.name ?? "不明なOrganization";
}

export default async function WithdrawalQueue({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="wordmark" href="/workspace">DANCE HUB</Link>
        <form action={logout}>
          <button className="button button-quiet" type="submit">ログアウト</button>
        </form>
      </header>
      <main className="workspace-main">
        <Link className="back-link" href="/admin/events">← Event審査へ戻る</Link>
        <section className="hero-card">
          <div>
            <p className="eyebrow">Platform Admin</p>
            <h1>掲載の取り下げ</h1>
            <p className="lede">
              取り下げは削除ではなく非公開化です。一覧・検索・直URLのいずれからも到達できなくなり、
              レコードと承認履歴は保持されます。判断基準は掲載基準Fを参照してください。
            </p>
          </div>
          <span className="queue-count">{withdrawn?.length ?? 0}件</span>
        </section>

        {params.error && errorMessages[params.error] ? <p className="notice notice-error" role="alert">{errorMessages[params.error]}</p> : null}
        {params.done && doneMessages[params.done] ? <p className="notice notice-success">{doneMessages[params.done]}</p> : null}

        <section className="review-list" aria-label="Eventの取り下げ">
          <div className="section-heading">
            <p className="eyebrow">Withdraw</p>
            <h2>取り下げる</h2>
          </div>
          <article className="review-card">
            <p className="field-help">
              取り下げ要請は公開ページのURLとともに届きます。そのURLの末尾のIDを貼り付けてください。
              中止（cancelled）とは別の操作です。中止は公開を維持したまま中止として表示します。
            </p>
            <form className="review-form" action={withdrawEvent}>
              <div className="field">
                <label htmlFor="withdraw-event-id">Event ID</label>
                <input id="withdraw-event-id" name="eventId" required placeholder="00000000-0000-0000-0000-000000000000" />
              </div>
              <div className="field">
                <label htmlFor="withdraw-reason">取り下げ理由（内部記録。公開されません）</label>
                <textarea id="withdraw-reason" name="reason" required rows={3} />
              </div>
              <div className="button-row">
                <button className="button button-danger" type="submit">取り下げる</button>
              </div>
            </form>
          </article>
        </section>

        <section className="review-list" aria-label="取り下げ済みEvent">
          <div className="section-heading">
            <p className="eyebrow">Withdrawn</p>
            <h2>取り下げ済み</h2>
          </div>
          {withdrawn?.length ? withdrawn.map((event) => {
            const revision = Array.isArray(event.event_revisions) ? event.event_revisions[0] : event.event_revisions;
            return (
              <article className="review-card" key={event.id}>
                <div className="review-card-header">
                  <div>
                    <p className="eyebrow">{organizationName(event.organizations as OrganizationValue)}</p>
                    <h2>{revision?.title ?? "公開Revisionなし"}</h2>
                  </div>
                  <span className="status status-rejected">withdrawn</span>
                </div>
                <dl className="details-list">
                  <div><dt>Event ID</dt><dd><code>{event.id}</code></dd></div>
                  <div><dt>取り下げ日時</dt><dd>{event.withdrawn_at ? dateTime.format(new Date(event.withdrawn_at)) : "—"}</dd></div>
                  <div><dt>理由</dt><dd>{event.withdrawal_reason ?? "—"}</dd></div>
                </dl>
                <form className="review-form" action={restoreEvent}>
                  <input name="eventId" type="hidden" value={event.id} />
                  <div className="field">
                    <label htmlFor={`restore-reason-${event.id}`}>復帰理由</label>
                    <textarea id={`restore-reason-${event.id}`} name="reason" required rows={2} />
                  </div>
                  <div className="button-row">
                    <button className="button button-primary" type="submit">復帰する</button>
                  </div>
                </form>
              </article>
            );
          }) : <div className="empty-state">取り下げ済みのEventはありません。</div>}
        </section>
      </main>
    </div>
  );
}
