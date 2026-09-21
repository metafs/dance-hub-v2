import Script from "next/script";

import { submitListingRequest } from "@/features/listing-requests/commands";
import { Notice } from "@/ui/notice";
import { PageHead } from "@/ui/page-head";

const errors: Record<string, string> = {
  "invalid-input": "対象Event、連絡先、依頼内容を入力してください。",
  "verification-failed": "bot確認に失敗しました。もう一度お試しください。",
  "submit-failed": "依頼を送信できませんでした。対象の公開Eventを確認してください。",
};

/**
 * The public intake for withdrawal and correction requests (listing policy F,
 * G-6). A withdrawal is honoured whatever the reason, so the form asks for no
 * justification beyond what the requester chooses to write.
 */
export default async function PublicListingRequestPage({ searchParams }: { searchParams: Promise<{ event?: string; kind?: string; error?: string; submitted?: string }> }) {
  const query = await searchParams;
  const kind = query.kind === "correction" ? "correction" : "withdrawal";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="container container-narrow">
      <PageHead
        lede="主催者・権利者・出演者の方は、理由を問わずご連絡ください。内容は公開されず、p8ce の運営が確認して対応します。"
        meta={<span>掲載について</span>}
        title={kind === "withdrawal" ? "掲載の削除を依頼する" : "掲載内容の修正を依頼する"}
      />
      {query.submitted ? <Notice tone="success">依頼を受け付けました。確認後にご連絡します。</Notice> : null}
      {query.error ? <Notice tone="error">{errors[query.error] ?? "依頼を送信できませんでした。"}</Notice> : null}
      {siteKey ? (
        <form action={submitListingRequest} className="form-stack">
          <input name="kind" type="hidden" value={kind} />
          <label>
            対象のEvent ID
            <span className="field-help">公開ページのURLの末尾にある英数字です。</span>
            <input defaultValue={query.event ?? ""} name="eventId" required />
          </label>
          <label>
            連絡先
            <span className="field-help">運営から返信するためのメールアドレスなど。公開されません。</span>
            <input maxLength={500} name="requesterContact" required />
          </label>
          <label>
            依頼内容
            <textarea maxLength={4000} name="message" required rows={6} />
          </label>
          <div className="cf-turnstile" data-sitekey={siteKey} />
          <div><button className="button button-primary" type="submit">依頼を送信する</button></div>
        </form>
      ) : (
        <Notice tone="info">現在この受付フォームは利用できません。</Notice>
      )}
      {siteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /> : null}
    </div>
  );
}
