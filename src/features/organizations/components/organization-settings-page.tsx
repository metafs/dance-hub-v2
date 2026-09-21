import { requireOrganizationCapability } from "@/features/organizations/policy";
import { EmptyState } from "@/ui/empty-state";
import { AppPageHead } from "@/ui/page-head";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { organization } = await requireOrganizationCapability(organizationId, "manageMembers");

  return (
    <main className="container-app app-main container-narrow">
      <AppPageHead
        description="MemberとRoleの管理はOwnerだけが行えます。"
        title={`${organization.name} の設定`}
      />
      <EmptyState>
        Memberの招待とRoleを変更する画面は、まだ用意されていません。
      </EmptyState>
    </main>
  );
}
