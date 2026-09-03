import Link from "next/link";

import { requireOrganizationMembership } from "@/features/organizations/policy";
import { getUserOrganizationMemberships } from "@/features/organizations/queries";
import {
  hasOrganizationCapability,
  isOrganizationRole,
} from "@/features/organizations/schema";

import { OrganizationSelector } from "./organization-selector";

const errorMessages: Record<string, string> = {
  "insufficient-role": "この操作にはOwner権限が必要です。",
};

export default async function OrganizationWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { organizationId } = await params;
  const query = await searchParams;
  const { organization, role, supabase, user } =
    await requireOrganizationMembership(organizationId);
  const { data: memberships } = await getUserOrganizationMemberships(supabase, user.id);

  const organizations = (memberships ?? []).flatMap((membership) => {
    const value = membership.organizations;
    const item = Array.isArray(value) ? value[0] : value;
    return item && isOrganizationRole(membership.role)
      ? [{ id: item.id, name: item.name, role: membership.role }]
      : [];
  });

  const capabilities = [
    ["Event Revisionを編集・提出", "editEvents"],
    ["Artist / Venue Candidateを作成", "createCandidates"],
    ["Organization情報を編集", "editOrganization"],
    ["MemberとRoleを管理", "manageMembers"],
    ["Eventの中止を申請", "requestCancellation"],
  ] as const;

  return (
    <main className="workspace-main">
      <div className="workspace-toolbar">
        <Link className="back-link" href="/workspace">← Workspace一覧</Link>
        <OrganizationSelector organizations={organizations} selectedId={organizationId} />
      </div>
      {query.error && errorMessages[query.error] ? (
        <p className="notice notice-error" role="alert">{errorMessages[query.error]}</p>
      ) : null}
      <section className="hero-card organization-hero">
        <div>
          <span className="role-chip">{role}</span>
          <p className="eyebrow">Organization Workspace</p>
          <h1>{organization.name}</h1>
          <p className="lede">このWorkspaceでは、サーバーで検証されたRoleだけが操作できます。</p>
        </div>
        {hasOrganizationCapability(role, "manageMembers") ? (
          <Link className="button button-secondary" href={`/workspace/${organizationId}/settings`}>
            Organization設定
          </Link>
        ) : null}
        {hasOrganizationCapability(role, "createCandidates") ? (
          <Link className="button button-primary" href={`/workspace/${organizationId}/entities`}>
            Artist / Venueを管理
          </Link>
        ) : null}
        {hasOrganizationCapability(role, "editEvents") ? (
          <Link className="button button-primary" href={`/workspace/${organizationId}/events`}>
            Eventを管理
          </Link>
        ) : null}
      </section>
      <section className="section-block" aria-labelledby="permissions-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Authorization</p>
            <h2 id="permissions-title">あなたの操作範囲</h2>
          </div>
        </div>
        <div className="permission-list">
          {capabilities.map(([label, capability]) => {
            const allowed = hasOrganizationCapability(role, capability);
            return (
              <div className="permission-row" key={capability}>
                <span>{label}</span>
                <strong className={allowed ? "permission-yes" : "permission-no"}>
                  {allowed ? "許可" : "不可"}
                </strong>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
