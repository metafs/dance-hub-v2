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
import { artistTypeOptions, prefectureOptions } from "@/features/shared-entities/schema";
import { AppPageHead } from "@/ui/page-head";
import { mainContentId } from "@/ui/skip-link";

function Breadcrumb({ organizationId, label }: { organizationId: string; label: string }) {
  return (
    <>
      <Link href={`/workspace/${organizationId}/entities`}>出演者・会場</Link>
      <span>/</span>
      <span>{label}</span>
    </>
  );
}

export default async function CandidateEditPage({ params }: { params: Promise<{ organizationId: string; candidateType: string; candidateId: string }> }) {
  const { organizationId, candidateType, candidateId } = await params;
  const { supabase } = await requireOrganizationCapability(organizationId, "createCandidates");

  if (candidateType === "artist") {
    const { data } = await getPendingArtistCandidate(supabase, organizationId, candidateId);
    if (!data) notFound();
    return (
      <main id={mainContentId} className="container-app app-main container-narrow">
        <AppPageHead
          breadcrumb={<Breadcrumb label="出演者の申請を編集" organizationId={organizationId} />}
          description="審査待ちのあいだだけ編集できます。"
          title={data.name}
        />
        <form action={updateArtistCandidate} className="form-panel">
          <input name="organizationId" type="hidden" value={organizationId}/>
          <input name="candidateId" type="hidden" value={candidateId}/>
          <label>出演者名<input defaultValue={data.name} name="name" required/></label>
          <label>種別<select defaultValue={data.artist_type} name="artistType">{artistTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label>プロフィール<textarea defaultValue={data.profile ?? ""} name="profile" rows={4}/></label>
          <label>Webサイト<input defaultValue={data.website_url ?? ""} name="websiteUrl" type="url"/></label>
          <div className="form-actions"><p>保存すると、運営は新しい内容で審査します。</p><button className="button button-primary">変更を保存</button></div>
        </form>
      </main>
    );
  }

  if (candidateType === "venue") {
    const { data } = await getPendingVenueCandidate(supabase, organizationId, candidateId);
    if (!data) notFound();
    return (
      <main id={mainContentId} className="container-app app-main container-narrow">
        <AppPageHead
          breadcrumb={<Breadcrumb label="会場の申請を編集" organizationId={organizationId} />}
          description="審査待ちのあいだだけ編集できます。"
          title={data.name}
        />
        <form action={updateVenueCandidate} className="form-panel">
          <input name="organizationId" type="hidden" value={organizationId}/>
          <input name="candidateId" type="hidden" value={candidateId}/>
          <label>会場名<input defaultValue={data.name} name="name" required/></label>
          <label>都県<select defaultValue={data.prefecture} name="prefecture">{prefectureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label>住所<input defaultValue={data.address_line1} name="addressLine1" required/></label>
          <label>建物名など<input defaultValue={data.address_line2 ?? ""} name="addressLine2"/></label>
          <label>Webサイト<input defaultValue={data.website_url ?? ""} name="websiteUrl" type="url"/></label>
          <div className="form-actions"><p>保存すると、運営は新しい内容で審査します。</p><button className="button button-primary">変更を保存</button></div>
        </form>
      </main>
    );
  }

  notFound();
}
