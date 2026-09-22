import Link from "next/link";

import { requireOrganizationCapability } from "@/features/organizations/policy";
import {
  createArtistCandidate,
  createVenueCandidate,
  requestArtistChange,
} from "@/features/shared-entities/commands";
import { getEntityWorkspaceData } from "@/features/shared-entities/queries";
import {
  artistTypeLabel,
  artistTypeOptions,
  candidateStatusLabel,
  prefectureName,
  prefectureOptions,
} from "@/features/shared-entities/schema";
import { EmptyState } from "@/ui/empty-state";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { StateLabel } from "@/ui/state-label";

export default async function EntityWorkspacePage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const { organizationId } = await params;
  const query = await searchParams;
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const [
    { data: artists },
    { data: venues },
    { data: artistCandidates },
    { data: venueCandidates },
  ] = await getEntityWorkspaceData(supabase, organizationId);

  const candidates = [
    ...(artistCandidates ?? []).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      kind: "出演者",
      detail: artistTypeLabel(candidate.artist_type),
      status: candidate.status,
      reason: candidate.decision_reason,
      href: `/workspace/${organizationId}/entities/artist/${candidate.id}`,
    })),
    ...(venueCandidates ?? []).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      kind: "会場",
      detail: prefectureName(candidate.prefecture),
      status: candidate.status,
      reason: candidate.decision_reason,
      href: `/workspace/${organizationId}/entities/venue/${candidate.id}`,
    })),
  ];

  return (
    <main className="container-app app-main">
      <AppPageHead
        description="Eventで選べる出演者と会場は、全Organizationで共有されています。一覧にないものは登録を申請し、運営の確認後に使えるようになります。"
        title="出演者・会場"
      />
      {query.created || query.updated ? <Notice tone="success">申請を保存しました。</Notice> : null}
      {query.error ? <Notice tone="error">保存できませんでした。入力内容と権限を確認してください。</Notice> : null}

      <Section id="entities-candidates" rule size="small" title="申請した候補">
        {candidates.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">名前</th>
                  <th scope="col">種類</th>
                  <th scope="col">状態</th>
                  <th scope="col">運営からのコメント</th>
                  <th scope="col"><span className="visually-hidden">操作</span></th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={`${candidate.kind}-${candidate.id}`}>
                    <td>{candidate.name}</td>
                    <td className="muted">{candidate.kind} · {candidate.detail}</td>
                    <td>
                      <StateLabel tone={candidate.status === "pending" ? "dashed" : candidate.status === "activated" ? "solid" : "outline"}>
                        {candidateStatusLabel(candidate.status)}
                      </StateLabel>
                    </td>
                    <td className="muted">{candidate.reason ?? "—"}</td>
                    <td>{candidate.status === "pending" ? <Link className="text-link" href={candidate.href}>編集する</Link> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>申請した候補はまだありません。</EmptyState>
        )}
      </Section>

      <Section id="entities-apply" rule size="small" title="登録を申請">
        <div className="panel-grid">
          <form action={createArtistCandidate} className="form-panel">
            <input name="organizationId" type="hidden" value={organizationId}/>
            <h3>出演者の登録を申請</h3>
            <label>出演者名<input name="name" required/></label>
            <label>種別<select name="artistType">{artistTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>プロフィール<textarea name="profile" rows={3}/></label>
            <label>Webサイト<input name="websiteUrl" type="url"/></label>
            <div><button className="button button-primary">出演者を申請</button></div>
          </form>
          <form action={createVenueCandidate} className="form-panel">
            <input name="organizationId" type="hidden" value={organizationId}/>
            <h3>会場の登録を申請</h3>
            <label>会場名<input name="name" required/></label>
            <label>都県<select name="prefecture">{prefectureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>住所<input name="addressLine1" required/></label>
            <label>建物名など<input name="addressLine2"/></label>
            <label>Webサイト<input name="websiteUrl" type="url"/></label>
            <div><button className="button button-primary">会場を申請</button></div>
          </form>
        </div>
      </Section>

      <Section id="entities-registered" rule size="small" title="登録済みの出演者・会場">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">出演者</th>
                <th scope="col">種別</th>
                <th scope="col">Webサイト</th>
                <th scope="col"><span className="visually-hidden">変更の申請</span></th>
              </tr>
            </thead>
            <tbody>
              {artists?.map((artist) => (
                <tr key={artist.id}>
                  <td>{artist.name}</td>
                  <td className="muted">{artistTypeLabel(artist.artist_type)}</td>
                  <td className="muted">{artist.website_url ?? "—"}</td>
                  <td>
                    <details>
                      <summary className="text-link">変更を申請</summary>
                      <form action={requestArtistChange} className="form-stack details-form">
                        <input name="organizationId" type="hidden" value={organizationId}/>
                        <input name="artistId" type="hidden" value={artist.id}/>
                        <input aria-label="変更後の出演者名" defaultValue={artist.name} name="name" required/>
                        <select aria-label="変更後の種別" defaultValue={artist.artist_type} name="artistType">{artistTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                        <div><button className="button button-quiet button-small">変更を申請する</button></div>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">会場</th>
                <th scope="col">都県</th>
                <th scope="col">住所</th>
              </tr>
            </thead>
            <tbody>
              {venues?.map((venue) => (
                <tr key={venue.id}>
                  <td>{venue.name}</td>
                  <td className="muted">{prefectureName(venue.prefecture)}</td>
                  <td className="muted">{venue.address_line1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </main>
  );
}
