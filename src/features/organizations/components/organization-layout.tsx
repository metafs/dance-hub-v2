import { requireOrganizationMembership } from "@/features/organizations/policy";
import { getUserOrganizationMemberships } from "@/features/organizations/queries";
import {
  hasOrganizationCapability,
  isOrganizationRole,
  organizationRoleLabel,
} from "@/features/organizations/schema";
import { TabNav, type TabItem } from "@/ui/tab-nav";

import { OrganizationSelector } from "./organization-selector";

/**
 * The Organization context shared by its workspace pages: which Organization,
 * the member's role, and tabs for what that role can open.
 */
export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { role, supabase, user } = await requireOrganizationMembership(organizationId);
  const { data: memberships } = await getUserOrganizationMemberships(supabase, user.id);

  const organizations = (memberships ?? []).flatMap((membership) => {
    const value = membership.organizations;
    const item = Array.isArray(value) ? value[0] : value;
    return item && isOrganizationRole(membership.role)
      ? [{ id: item.id, name: item.name, roleLabel: organizationRoleLabel(membership.role) }]
      : [];
  });

  const base = `/workspace/${organizationId}`;
  const tabs: TabItem[] = [
    { href: base, label: "概要", exact: true },
    ...(hasOrganizationCapability(role, "editEvents") ? [{ href: `${base}/events`, label: "Event" }] : []),
    ...(hasOrganizationCapability(role, "createCandidates") ? [{ href: `${base}/entities`, label: "出演者・会場" }] : []),
    ...(hasOrganizationCapability(role, "manageMembers") ? [{ href: `${base}/settings`, label: "Organization設定" }] : []),
  ];

  return (
    <>
      <div className="app-context">
        <div className="container-app app-context-inner">
          <div className="app-context-org">
            <OrganizationSelector organizations={organizations} selectedId={organizationId} />
          </div>
          <TabNav items={tabs} label="Organization" />
        </div>
      </div>
      {children}
    </>
  );
}
