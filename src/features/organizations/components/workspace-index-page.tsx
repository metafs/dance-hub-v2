import Link from "next/link";

import { requireUser } from "@/features/auth/policy";
import { getWorkspaceIndexData } from "@/features/organizations/queries";
import { isOrganizationRole } from "@/features/organizations/schema";

import { OrganizationSelector } from "./organization-selector";

const errorMessages: Record<string, string> = {
  "organization-access-denied": "このOrganizationへアクセスする権限がありません。",
  "platform-admin-required": "Platform Admin権限が必要です。",
};

export default async function WorkspaceIndex({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
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
    <main className="workspace-main">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Identity &amp; Organization</p>
          <h1>Workspace</h1>
          <p className="lede">所属Organizationを選び、権限に応じた業務を開始します。</p>
        </div>
        {organizations.length ? (
          <OrganizationSelector organizations={organizations} />
        ) : (
          <Link className="button button-primary" href="/workspace/apply">
            Organizationを申請
          </Link>
        )}
      </section>

      {params.error && errorMessages[params.error] ? (
        <p className="notice notice-error" role="alert">
          {errorMessages[params.error]}
        </p>
      ) : null}
      {params.submitted ? (
        <p className="notice notice-success">Organization申請を提出しました。</p>
      ) : null}

      <section className="section-block" aria-labelledby="organizations-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Memberships</p>
            <h2 id="organizations-title">所属Organization</h2>
          </div>
          {organizations.length ? (
            <Link className="text-link" href="/workspace/apply">
              別のOrganizationを申請
            </Link>
          ) : null}
        </div>
        {organizations.length ? (
          <div className="card-grid">
            {organizations.map((organization) => (
              <Link className="entity-card" href={`/workspace/${organization.id}`} key={organization.id}>
                <span className="role-chip">{organization.role}</span>
                <h3>{organization.name}</h3>
                <span className="text-link">Workspaceを開く →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">承認済みのOrganizationはまだありません。</div>
        )}
      </section>

      <section className="section-block" aria-labelledby="applications-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Applications</p>
            <h2 id="applications-title">申請状況</h2>
          </div>
        </div>
        {applications?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>状態</th>
                  <th>審査メモ</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>{application.name}</td>
                    <td><span className={`status status-${application.status}`}>{application.status}</span></td>
                    <td>{application.decision_reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">申請履歴はありません。</div>
        )}
      </section>

      {isPlatformAdmin === true ? (
        <div className="admin-banner">
          <span>Platform Admin</span>
          <Link href="/admin/applications">Organization申請の審査キュー →</Link>
          <Link href="/admin/entities">Artist / Venue候補の審査 →</Link>
          <Link href="/admin/events">Event公開・中止の審査 →</Link>
        </div>
      ) : null}
    </main>
  );
}
