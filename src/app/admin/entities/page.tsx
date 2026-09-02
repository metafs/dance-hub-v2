import Link from "next/link";

import { logout } from "@/app/login/actions";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { reviewCandidate } from "./actions";

export default async function EntityReviewPage({ searchParams }: { searchParams: Promise<{ reviewed?: string; error?: string }> }) {
  const query = await searchParams;
  const { supabase } = await requirePlatformAdmin();
  const [{ data: artists }, { data: venues }, { data: artistCandidates }, { data: venueCandidates }] = await Promise.all([
    supabase.from("artists").select("id, name").order("name"), supabase.from("venues").select("id, name").order("name"),
    supabase.from("artist_candidates").select("id, name, artist_type, creator_organization_id").eq("status", "pending").order("created_at"),
    supabase.from("venue_candidates").select("id, name, prefecture, address_line1, creator_organization_id").eq("status", "pending").order("created_at"),
  ]);
  const card = (candidate: { id: string; name: string; artist_type?: string; prefecture?: string; address_line1?: string }, kind: "artist" | "venue", canonical: { id: string; name: string }[] | null) => <article className="review-card" key={candidate.id}><span className="status status-submitted">pending {kind}</span><h2>{candidate.name}</h2><p>{candidate.artist_type ?? `${candidate.prefecture} ${candidate.address_line1}`}</p><form action={reviewCandidate} className="review-form"><input name="candidateId" type="hidden" value={candidate.id}/><input name="kind" type="hidden" value={kind}/><label>審査理由<textarea name="reason" required rows={2}/></label><label>重複時の統合先<select name="survivorId" defaultValue=""><option value="">統合しない</option>{canonical?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="button-row"><button className="button button-primary" name="action" value="activate">承認・有効化</button><button className="button button-danger" name="action" value="reject">却下</button><button className="button button-quiet" name="action" value="merge">統合</button></div></form></article>;
  return <div className="app-shell"><header className="app-header"><Link className="wordmark" href="/workspace">DANCE HUB</Link><form action={logout}><button className="button button-quiet">ログアウト</button></form></header><main className="workspace-main"><Link className="back-link" href="/workspace">← Workspaceへ戻る</Link><section className="hero-card"><div><p className="eyebrow">Platform Admin</p><h1>Artist / Venue 審査</h1><p className="lede">承認、有効化、却下、重複統合は監査記録つきのDB遷移で実行されます。</p></div></section>{query.reviewed ? <p className="notice notice-success">審査結果を保存しました。</p> : null}{query.error ? <p className="notice notice-error" role="alert">審査を保存できませんでした。統合先と理由を確認してください。</p> : null}<section className="review-list" aria-label="Artist候補の審査">{artistCandidates?.map((item) => card(item, "artist", artists))}</section><section className="review-list" aria-label="Venue候補の審査">{venueCandidates?.map((item) => card(item, "venue", venues))}</section></main></div>;
}
