import Link from "next/link";

import { requireUser } from "@/features/auth/policy";
import { submitOrganizationApplication } from "@/features/organizations/commands";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { mainContentId } from "@/ui/skip-link";

const errorMessages: Record<string, string> = {
  "already-submitted": "審査中の申請がすでにあります。",
  "invalid-name": "Organization名を1〜160文字で入力してください。",
  "invalid-website": "WebサイトはhttpまたはhttpsのURLで入力してください。",
  "invalid-evidence": "責任者を特定できる情報と有効な連絡先を入力してください。",
  "invalid-activity": "活動確認用に、公式サイト・SNS・過去公演のいずれかのURLを入力してください。",
  "submission-failed": "申請を提出できませんでした。時間をおいて再度お試しください。",
};

export default async function OrganizationApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const params = await searchParams;

  return (
    <main id={mainContentId} className="container-app app-main container-narrow">
      <AppPageHead
        breadcrumb={<><Link href="/workspace">Workspace</Link><span>/</span><span>Organizationを申請</span></>}
        description="運営が確認して承認すると、あなたが最初のOwnerになります。承認されるまで、Eventの作成や掲載はできません。確認の基準は掲載基準Eです。"
        title="Organizationを申請"
      />
      {params.error && errorMessages[params.error] ? (
        <Notice tone="error">{errorMessages[params.error]}</Notice>
      ) : null}
      <form action={submitOrganizationApplication} className="form-panel">
        <label>
          <span>Organization名 <span className="required-mark">必須</span></span>
          <input maxLength={160} name="name" required />
        </label>
        <label>
          <span>責任者を特定できる情報 <span className="required-mark">必須</span></span>
          <input maxLength={200} name="responsibleParty" required />
        </label>
        <label>
          <span>連絡先（メールアドレス、電話番号、問い合わせURLなど） <span className="required-mark">必須</span></span>
          <input maxLength={500} name="contact" required />
        </label>
        <label>
          <span>活動確認URL（公式サイト・SNS・過去公演） <span className="required-mark">必須</span></span>
          <input name="activityUrl" placeholder="https://example.com" required type="url" />
        </label>
        <label>
          Webサイト
          <input name="websiteUrl" placeholder="https://example.com" type="url" />
        </label>
        <div className="form-actions">
          <p>申請内容は運営だけが確認します。</p>
          <button className="button button-primary" type="submit">審査へ提出</button>
        </div>
      </form>
    </main>
  );
}
