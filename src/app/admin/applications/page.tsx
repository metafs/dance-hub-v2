import Link from "next/link";

import { logout } from "@/app/login/actions";
import { requirePlatformAdmin } from "@/lib/auth/authorization";

import { approveApplication, rejectApplication } from "./actions";

const errorMessages: Record<string, string> = {
  "invalid-application": "申請を特定できませんでした。",
  "rejection-reason-required": "却下理由を入力してください。",
  "review-failed": "審査結果を保存できませんでした。申請状態を確認してください。",
};

export default async function ApplicationReviewQueue({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reviewed?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePlatformAdmin();
  const { data: applications } = await supabase
    .from("organization_applications")
    .select("id, applicant_id, name, website_url, status, created_at")
    .eq("status", "submitted")
    .order("created_at");

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
          <h1>Organization申請審査</h1>
          <p className="lede">承認するとOrganizationと初期Ownerが同一transactionで作成されます。</p>
        </div>
        <span className="queue-count">{applications?.length ?? 0}件</span>
        </section>
        {params.error && errorMessages[params.error] ? (
          <p className="notice notice-error" role="alert">{errorMessages[params.error]}</p>
        ) : null}
        {params.reviewed ? (
          <p className="notice notice-success">審査結果を保存しました。</p>
        ) : null}
        <section className="review-list" aria-label="審査待ちOrganization申請">
          {applications?.length ? applications.map((application) => (
            <article className="review-card" key={application.id}>
              <div className="review-card-header">
                <div>
                  <p className="eyebrow">Submitted</p>
                  <h2>{application.name}</h2>
                </div>
                <span className="status status-submitted">submitted</span>
              </div>
              <dl className="details-list">
                <div><dt>Applicant ID</dt><dd>{application.applicant_id}</dd></div>
                <div><dt>Webサイト</dt><dd>{application.website_url ?? "—"}</dd></div>
              </dl>
              <form className="review-form">
                <input name="applicationId" type="hidden" value={application.id} />
                <label>
                  審査メモ / 却下理由
                  <textarea name="reason" rows={3} />
                </label>
                <div className="button-row">
                  <button className="button button-primary" formAction={approveApplication} type="submit">承認</button>
                  <button className="button button-danger" formAction={rejectApplication} type="submit">却下</button>
                </div>
              </form>
            </article>
          )) : <div className="empty-state">審査待ちの申請はありません。</div>}
        </section>
      </main>
    </div>
  );
}
