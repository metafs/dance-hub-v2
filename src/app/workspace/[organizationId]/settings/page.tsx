import Link from "next/link";

import { requireOrganizationCapability } from "@/lib/auth/authorization";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { organization } = await requireOrganizationCapability(organizationId, "manageMembers");

  return (
    <main className="workspace-main narrow-main">
      <Link className="back-link" href={`/workspace/${organizationId}`}>← Workspaceへ戻る</Link>
      <section className="form-card">
        <p className="eyebrow">Owner only</p>
        <h1>{organization.name} の設定</h1>
        <p className="lede">MemberとRoleの管理はOwnerだけが行えます。</p>
        <div className="empty-state">M2では認可境界を提供し、詳細なMember管理UIは後続へ引き継ぎます。</div>
      </section>
    </main>
  );
}
