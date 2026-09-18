import Link from "next/link";
import { notFound } from "next/navigation";

import { requireOrganizationCapability } from "@/features/organizations/policy";
import {
  updateArtistCandidate,
  updateVenueCandidate,
} from "@/features/shared-entities/commands";
import {
  getPendingArtistCandidate,
  getPendingVenueCandidate,
} from "@/features/shared-entities/queries";

export default async function CandidateEditPage({ params }: { params: Promise<{ organizationId: string; candidateType: string; candidateId: string }> }) {
  const { organizationId, candidateType, candidateId } = await params;
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");
  if (candidateType === "artist") {
    const { data } = await getPendingArtistCandidate(
      supabase,
      organizationId,
      candidateId,
    );
    if (!data) notFound();
    return <main className="workspace-main narrow-main"><Link className="back-link" href={`/workspace/${organizationId}/entities`}>← 候補一覧へ戻る</Link><form action={updateArtistCandidate} className="form-card form-stack"><input name="organizationId" type="hidden" value={organizationId}/><input name="candidateId" type="hidden" value={candidateId}/><h1>Artist候補を編集</h1><label>Artist名<input defaultValue={data.name} name="name" required/></label><label>種別<select defaultValue={data.artist_type} name="artistType"><option value="individual">individual</option><option value="company">company</option><option value="collective">collective</option><option value="other">other</option></select></label><label>プロフィール<textarea defaultValue={data.profile ?? ""} name="profile" rows={3}/></label><label>Webサイト<input defaultValue={data.website_url ?? ""} name="websiteUrl" type="url"/></label><button className="button button-primary">変更を保存</button></form></main>;
  }
  if (candidateType === "venue") {
    const { data } = await getPendingVenueCandidate(
      supabase,
      organizationId,
      candidateId,
    );
    if (!data) notFound();
    return <main className="workspace-main narrow-main"><Link className="back-link" href={`/workspace/${organizationId}/entities`}>← 候補一覧へ戻る</Link><form action={updateVenueCandidate} className="form-card form-stack"><input name="organizationId" type="hidden" value={organizationId}/><input name="candidateId" type="hidden" value={candidateId}/><h1>Venue候補を編集</h1><label>会場名<input defaultValue={data.name} name="name" required/></label><label>Prefecture<select defaultValue={data.prefecture} name="prefecture"><option value="TOKYO">東京都</option><option value="KANAGAWA">神奈川県</option></select></label><label>住所<input defaultValue={data.address_line1} name="addressLine1" required/></label><label>建物名等<input defaultValue={data.address_line2 ?? ""} name="addressLine2"/></label><label>Webサイト<input defaultValue={data.website_url ?? ""} name="websiteUrl" type="url"/></label><button className="button button-primary">変更を保存</button></form></main>;
  }
  notFound();
}
