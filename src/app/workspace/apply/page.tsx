import Link from "next/link";

import { requireUser } from "@/lib/auth/authorization";

import { submitOrganizationApplication } from "../actions";

const errorMessages: Record<string, string> = {
  "already-submitted": "審査中の申請がすでにあります。",
  "invalid-name": "Organization名を1〜160文字で入力してください。",
  "invalid-website": "WebサイトはhttpまたはhttpsのURLで入力してください。",
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
    <main className="workspace-main narrow-main">
      <Link className="back-link" href="/workspace">← Workspaceへ戻る</Link>
      <section className="form-card" aria-labelledby="application-title">
        <p className="eyebrow">Organization Application</p>
        <h1 id="application-title">Organizationを申請</h1>
        <p className="lede">審査承認後、あなたが最初のOwnerになります。</p>
        {params.error && errorMessages[params.error] ? (
          <p className="notice notice-error" role="alert">{errorMessages[params.error]}</p>
        ) : null}
        <form action={submitOrganizationApplication} className="form-stack">
          <label>
            Organization名 <span aria-hidden="true">*</span>
            <input maxLength={160} name="name" required />
          </label>
          <label>
            Webサイト
            <input name="websiteUrl" placeholder="https://example.com" type="url" />
          </label>
          <button className="button button-primary" type="submit">審査へ提出</button>
        </form>
      </section>
    </main>
  );
}
