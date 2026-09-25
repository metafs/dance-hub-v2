import Link from "next/link";

import { requireUser } from "@/features/auth/policy";
import { getWorkspaceIndexData } from "@/features/organizations/queries";
import {
  applicationStatusLabel,
  isOrganizationRole,
  organizationRoleLabel,
} from "@/features/organizations/schema";
import { EmptyState } from "@/ui/empty-state";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { StateLabel } from "@/ui/state-label";
import { TableFrame } from "@/ui/table-frame";
import { mainContentId } from "@/ui/skip-link";

const errorMessages: Record<string, string> = {
  "organization-access-denied": "このOrganizationへアクセスする権限がありません。",
  "platform-admin-required": "Platform Admin権限が必要です。",
};

export default async function WorkspaceIndex({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string; passwordSet?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: memberships }, { data: applications }, { data: isPlatformAdmin }] =
    await getWorkspaceIndexData(supabase, user.id);

  const organizations = (memberships ?? []).flatMap((membership) => {
    const value = membership.organizations;
    const organization = Array.isArray(value) ? value[0] : value;
    return organization && isOrganizationRole(membership.role)
      ? [{ id: organization.id, name: organization.name, role: membership.role }]
      : [];
  });

  return (
    <main id={mainContentId} className="container-app app-main">
      <AppPageHead
        description="所属しているOrganizationを選ぶと、Eventの掲載と更新、出演者・会場の登録申請ができます。"
        title="Workspace"
      />

      {params.error && errorMessages[params.error] ? (
        <Notice tone="error">{errorMessages[params.error]}</Notice>
      ) : null}
      {params.submitted ? (
        <Notice tone="success">Organization申請を提出しました。</Notice>
      ) : null}
      {params.passwordSet ? (
        <Notice tone="success">パスワードを保存しました。次回からこのパスワードでログインできます。</Notice>
      ) : null}

      <Section
        aside={organizations.length ? (
          <Link className="text-link" href="/workspace/apply">別のOrganizationを申請</Link>
        ) : null}
        id="workspace-organizations"
        rule
        size="small"
        title="所属Organization"
      >
        {organizations.length ? (
          <div className="org-cards">
            {organizations.map((organization) => (
              <Link className="org-card" href={`/workspace/${organization.id}`} key={organization.id}>
                <StateLabel tone="quiet">{organizationRoleLabel(organization.role)}</StateLabel>
                <span className="org-card-name">{organization.name}</span>
                <span className="org-card-more">Workspaceを開く →</span>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <EmptyState>承認済みのOrganizationはまだありません。掲載を始めるには、Organizationを申請してください。</EmptyState>
            <div>
              <Link className="button button-primary" href="/workspace/apply">Organizationを申請</Link>
            </div>
          </>
        )}
      </Section>

      <Section id="workspace-applications" rule size="small" title="申請状況">
        {applications?.length ? (
          <TableFrame label="申請状況">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Organization</th>
                  <th scope="col">状態</th>
                  <th scope="col">審査コメント</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>{application.name}</td>
                    <td>
                      <StateLabel tone={application.status === "submitted" ? "dashed" : application.status === "approved" ? "solid" : "outline"}>
                        {applicationStatusLabel(application.status)}
                      </StateLabel>
                    </td>
                    <td>{application.decision_reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
        ) : (
          <EmptyState>申請履歴はありません。</EmptyState>
        )}
      </Section>

      {isPlatformAdmin === true ? (
        <Section id="workspace-admin" rule size="small" title="運営">
          <div className="link-panels">
            <Link className="link-panel" href="/admin/events">
              <strong>Event公開・中止の審査</strong>
              <span>公開・更新の申請と中止の申請</span>
            </Link>
            <Link className="link-panel" href="/admin/applications">
              <strong>Organization申請の審査キュー</strong>
              <span>新しい主催者の承認</span>
            </Link>
            <Link className="link-panel" href="/admin/entities">
              <strong>出演者・会場候補の審査</strong>
              <span>登録・却下・重複の統合</span>
            </Link>
          </div>
        </Section>
      ) : null}
    </main>
  );
}
