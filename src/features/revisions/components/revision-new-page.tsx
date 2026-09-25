import Link from "next/link";

import { requireOrganizationCapability } from "@/features/organizations/policy";
import { getRevisionListData } from "@/features/revisions/queries";
import { AppPageHead } from "@/ui/page-head";
import { mainContentId } from "@/ui/skip-link";

import { EventDraftForm } from "./event-draft-form";

export default async function EventNewPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const [{ data: revisions }, { data: artists }, { data: venues }] =
    await getRevisionListData(supabase);
  const base = `/workspace/${organizationId}/events`;

  return (
    <main id={mainContentId} className="container-app app-main container-narrow">
      <AppPageHead
        breadcrumb={<><Link href={base}>Event</Link><span>/</span><span>新規作成</span></>}
        description="まず下書きとして保存します。画像は下書きを作成したあとに追加できます。公開には運営の審査が必要です。"
        title="Event"
      />
      <EventDraftForm
        artists={artists ?? []}
        festivalParents={[...new Map(
          (revisions ?? [])
            .filter((revision) => revision.event_type === "festival")
            .map((revision) => [revision.event_id, { id: revision.event_id, title: revision.title }]),
        ).values()]}
        organizationId={organizationId}
        venues={venues ?? []}
      />
    </main>
  );
}
