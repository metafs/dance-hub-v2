import Link from "next/link";
import Script from "next/script";

import { submitListingRequest } from "@/features/listing-requests/commands";

const errors: Record<string, string> = {
  "invalid-input": "対象Event、連絡先、要請内容を入力してください。",
  "verification-failed": "bot確認に失敗しました。もう一度お試しください。",
  "submit-failed": "要請を送信できませんでした。対象の公開Eventを確認してください。",
};

export default async function PublicListingRequestPage({ searchParams }: { searchParams: Promise<{ event?: string; kind?: string; error?: string; submitted?: string }> }) {
  const query = await searchParams;
  const kind = query.kind === "correction" ? "correction" : "withdrawal";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return <main className="workspace-main narrow-main"><Link className="back-link" href="/">← DANCE HUB</Link><section className="form-card"><p className="eyebrow">Listing request</p><h1>{kind === "withdrawal" ? "掲載削除を要請する" : "掲載情報の修正を要請する"}</h1><p className="lede">主催者・権利者・出演者の方は、理由を問わずご連絡ください。内容は公開されず、Platform Admin が対応します。</p>{query.submitted ? <p className="notice notice-success">要請を受け付けました。確認後にご連絡します。</p> : null}{query.error ? <p className="notice notice-error" role="alert">{errors[query.error] ?? "要請を送信できませんでした。"}</p> : null}{siteKey ? <form action={submitListingRequest} className="form-stack"><input name="kind" type="hidden" value={kind}/><label>公開Event ID <input defaultValue={query.event ?? ""} name="eventId" required /></label><label>連絡先 <input maxLength={500} name="requesterContact" required /></label><label>要請内容 <textarea maxLength={4000} name="message" required rows={6} /></label><div className="cf-turnstile" data-sitekey={siteKey}/><button className="button button-danger" type="submit">要請を送信</button></form> : <p className="notice notice-error">現在この受付フォームは利用できません。</p>}</section>{siteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/> : null}</main>;
}
