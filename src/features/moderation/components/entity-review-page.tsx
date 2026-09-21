import { reviewCandidate } from "@/features/moderation/commands";
import { requirePlatformAdmin } from "@/features/moderation/policy";
import { getEntityReviewData } from "@/features/moderation/queries";
import { artistTypeLabel, prefectureName } from "@/features/shared-entities/schema";
import { EmptyState } from "@/ui/empty-state";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { StateLabel } from "@/ui/state-label";

type Candidate = {
  id: string;
  name: string;
  artist_type?: string;
  prefecture?: string;
  address_line1?: string;
};

function CandidateReview({
  candidate,
  kind,
  canonical,
}: {
  candidate: Candidate;
  kind: "artist" | "venue";
  canonical: { id: string; name: string }[] | null;
}) {
  const detail = kind === "artist"
    ? `出演者 · ${artistTypeLabel(candidate.artist_type ?? "")}`
    : `会場 · ${prefectureName(candidate.prefecture ?? "")} ${candidate.address_line1 ?? ""}`;

  return (
    <article className="review-item">
      <div className="review-item-head">
        <div className="review-item-title">
          <span className="review-item-sub">{detail}</span>
          <h2>{candidate.name}</h2>
        </div>
        <StateLabel tone="dashed">審査待ち</StateLabel>
      </div>
      <form action={reviewCandidate} className="review-form">
        <input name="candidateId" type="hidden" value={candidate.id} />
        <input name="kind" type="hidden" value={kind} />
        <label>審査理由<textarea name="reason" required rows={2} /></label>
        <label>
          重複時の統合先
          <select defaultValue="" name="survivorId">
            <option value="">統合しない</option>
            {canonical?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="button-row">
          <button className="button button-primary" name="action" value="activate">承認・有効化</button>
          <button className="button button-danger" name="action" value="reject">却下</button>
          <button className="button button-quiet" name="action" value="merge">統合</button>
        </div>
      </form>
    </article>
  );
}

export default async function EntityReviewPage({ searchParams }: { searchParams: Promise<{ reviewed?: string; error?: string }> }) {
  const query = await searchParams;
  const { supabase } = await requirePlatformAdmin();
  const [
    { data: artists },
    { data: venues },
    { data: artistCandidates },
    { data: venueCandidates },
  ] = await getEntityReviewData(supabase);

  return (
    <main className="container-app app-main">
      <AppPageHead
        description="承認、却下、重複の統合は監査記録つきで行われます。統合すると、候補への参照は統合先に移ります。"
        title="出演者・会場候補の審査"
      />
      {query.reviewed ? <Notice tone="success">審査結果を保存しました。</Notice> : null}
      {query.error ? <Notice tone="error">審査を保存できませんでした。統合先と理由を確認してください。</Notice> : null}

      <Section
        aside={<span className="tabular muted">{artistCandidates?.length ?? 0}件</span>}
        id="queue-artists"
        rule
        size="small"
        title="出演者の候補"
      >
        {artistCandidates?.length ? (
          <div className="panels">
            {artistCandidates.map((item) => (
              <CandidateReview canonical={artists} candidate={item} key={item.id} kind="artist" />
            ))}
          </div>
        ) : <EmptyState>審査待ちの出演者はありません。</EmptyState>}
      </Section>

      <Section
        aside={<span className="tabular muted">{venueCandidates?.length ?? 0}件</span>}
        id="queue-venues"
        rule
        size="small"
        title="会場の候補"
      >
        {venueCandidates?.length ? (
          <div className="panels">
            {venueCandidates.map((item) => (
              <CandidateReview canonical={venues} candidate={item} key={item.id} kind="venue" />
            ))}
          </div>
        ) : <EmptyState>審査待ちの会場はありません。</EmptyState>}
      </Section>
    </main>
  );
}
