import {
  approveApplication,
  rejectApplication,
} from "@/features/moderation/commands";
import { requirePlatformAdmin } from "@/features/moderation/policy";
import { getApplicationReviewQueue } from "@/features/moderation/queries";
import { DefinitionRows } from "@/ui/definition-rows";
import { EmptyState } from "@/ui/empty-state";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { StateLabel } from "@/ui/state-label";

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
  const { data: applications } = await getApplicationReviewQueue(supabase);

  return (
    <main className="container-app app-main">
      <AppPageHead
        description="承認すると、Organizationと最初のOwnerが同時に作成されます。判断の基準は掲載基準Eです。"
        title="Organization申請の審査"
      />
      {params.error && errorMessages[params.error] ? <Notice tone="error">{errorMessages[params.error]}</Notice> : null}
      {params.reviewed ? <Notice tone="success">審査結果を保存しました。</Notice> : null}

      <Section
        aside={<span className="tabular muted">{applications?.length ?? 0}件</span>}
        id="queue-applications"
        rule
        size="small"
        title="審査待ちの申請"
      >
        {applications?.length ? (
          <div className="panels">
            {applications.map((application) => (
              <article className="review-item" key={application.id}>
                <div className="review-item-head">
                  <h2>{application.name}</h2>
                  <StateLabel tone="dashed">審査中</StateLabel>
                </div>
                <DefinitionRows
                  rows={[
                    { key: "applicant", term: "申請者ID", detail: <code>{application.applicant_id}</code> },
                    { key: "responsible", term: "責任者", detail: application.responsible_party },
                    { key: "contact", term: "連絡先", detail: application.contact },
                    { key: "activity", term: "活動確認", detail: application.activity_url },
                    { key: "website", term: "Webサイト", detail: application.website_url ?? "—" },
                  ]}
                />
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
            ))}
          </div>
        ) : <EmptyState>審査待ちの申請はありません。</EmptyState>}
      </Section>
    </main>
  );
}
