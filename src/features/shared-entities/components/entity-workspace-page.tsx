import Link from "next/link";

import { requireOrganizationCapability } from "@/features/organizations/policy";

import {
  createArtistCandidate,
  createVenueCandidate,
  requestArtistChange,
} from "@/features/shared-entities/commands";
import { getEntityWorkspaceData } from "@/features/shared-entities/queries";

const types = ["individual", "company", "collective", "other"];

export default async function EntityWorkspacePage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ created?: string; updated?: string; error?: string }> }) {
  const { organizationId } = await params;
  const query = await searchParams;
  const { organization, supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  const [
    { data: artists },
    { data: venues },
    { data: artistCandidates },
    { data: venueCandidates },
  ] = await getEntityWorkspaceData(supabase, organizationId);
  return <main className="workspace-main">
    <Link className="back-link" href={`/workspace/${organizationId}`}>← Workspaceへ戻る</Link>
    <section className="hero-card"><div><p className="eyebrow">Shared data</p><h1>Artist / Venue</h1><p className="lede">{organization.name} の候補を作成し、Platform Adminの審査へ送ります。</p></div></section>
    {query.created || query.updated ? <p className="notice notice-success">候補または変更申請を保存しました。</p> : null}
    {query.error ? <p className="notice notice-error" role="alert">保存できませんでした。入力内容と権限を確認してください。</p> : null}
    <section className="section-block"><h2>Canonical search</h2><div className="card-grid">{artists?.map((artist) => <article className="entity-card" key={artist.id}><span className="role-chip">{artist.artist_type}</span><h3>{artist.name}</h3><p>{artist.website_url ?? "Webサイト未登録"}</p><details><summary>変更を申請</summary><form action={requestArtistChange} className="form-stack"><input name="organizationId" type="hidden" value={organizationId}/><input name="artistId" type="hidden" value={artist.id}/><input aria-label="変更後のArtist名" defaultValue={artist.name} name="name" required/><select aria-label="変更後のArtist種別" defaultValue={artist.artist_type} name="artistType">{types.map((type) => <option key={type}>{type}</option>)}</select><button className="button button-quiet">変更申請</button></form></details></article>)}</div><div className="card-grid">{venues?.map((venue) => <article className="entity-card" key={venue.id}><span className="role-chip">{venue.prefecture}</span><h3>{venue.name}</h3><p>{venue.address_line1}</p></article>)}</div></section>
    <section className="section-block"><h2>候補を作成</h2><div className="card-grid"><form action={createArtistCandidate} className="form-card form-stack"><input name="organizationId" type="hidden" value={organizationId}/><h3>Artist Candidate</h3><label>Artist名<input name="name" required/></label><label>種別<select name="artistType">{types.map((type) => <option key={type}>{type}</option>)}</select></label><label>プロフィール<textarea name="profile" rows={3}/></label><label>Webサイト<input name="websiteUrl" type="url"/></label><button className="button button-primary">Artist候補を提出</button></form><form action={createVenueCandidate} className="form-card form-stack"><input name="organizationId" type="hidden" value={organizationId}/><h3>Venue Candidate</h3><label>会場名<input name="name" required/></label><label>Prefecture<select name="prefecture"><option value="TOKYO">東京都</option><option value="KANAGAWA">神奈川県</option></select></label><label>住所<input name="addressLine1" required/></label><label>建物名等<input name="addressLine2"/></label><label>Webサイト<input name="websiteUrl" type="url"/></label><button className="button button-primary">Venue候補を提出</button></form></div></section>
    <section className="section-block"><h2>このOrganizationの候補</h2><div className="card-grid">{artistCandidates?.map((candidate) => <article className="entity-card" key={candidate.id}><span className="status">{candidate.status}</span><h3>{candidate.name}</h3><p>{candidate.artist_type}</p><p>{candidate.decision_reason ?? "審査待ち"}</p>{candidate.status === "pending" ? <Link className="text-link" href={`/workspace/${organizationId}/entities/artist/${candidate.id}`}>編集する →</Link> : null}</article>)}{venueCandidates?.map((candidate) => <article className="entity-card" key={candidate.id}><span className="status">{candidate.status}</span><h3>{candidate.name}</h3><p>{candidate.prefecture}</p><p>{candidate.decision_reason ?? "審査待ち"}</p>{candidate.status === "pending" ? <Link className="text-link" href={`/workspace/${organizationId}/entities/venue/${candidate.id}`}>編集する →</Link> : null}</article>)}</div></section>
  </main>;
}
