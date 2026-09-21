import Link from "next/link";

import { requireOrganizationMembership } from "@/features/organizations/policy";
import {
  hasOrganizationCapability,
  organizationRoleLabel,
} from "@/features/organizations/schema";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";

const errorMessages: Record<string, string> = {
  "insufficient-role": "この操作にはOwner権限が必要です。",
};

const capabilities = [
  ["Eventの下書き・編集・審査への提出", "editEvents"],
  ["出演者・会場の登録申請", "createCandidates"],
  ["Organization情報の編集", "editOrganization"],
  ["MemberとRoleの管理", "manageMembers"],
  ["Eventの中止申請", "requestCancellation"],
] as const;

export default async function OrganizationWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { organizationId } = await params;
  const query = await searchParams;
  const { organization, role } = await requireOrganizationMembership(organizationId);

  return (
    <main className="container-app app-main">
      <AppPageHead
        description={`あなたは${organizationRoleLabel(role)}です。操作できる範囲はサーバー側で確認されます。`}
        title={organization.name}
      />
      {query.error && errorMessages[query.error] ? (
        <Notice tone="error">{errorMessages[query.error]}</Notice>
      ) : null}

      <div className="link-panels">
        {hasOrganizationCapability(role, "editEvents") ? (
          <Link className="link-panel" href={`/workspace/${organizationId}/events`}>
            <strong>Event</strong>
            <span>下書きの作成、審査への提出、公開後の更新と中止の申請</span>
          </Link>
        ) : null}
        {hasOrganizationCapability(role, "createCandidates") ? (
          <Link className="link-panel" href={`/workspace/${organizationId}/entities`}>
            <strong>出演者・会場</strong>
            <span>一覧にない出演者や会場の登録を申請</span>
          </Link>
        ) : null}
      </div>

      <Section id="organization-capabilities" rule size="small" title="あなたの操作範囲">
        <dl className="capabilities">
          {capabilities.map(([label, capability]) => {
            const allowed = hasOrganizationCapability(role, capability);
            return (
              <div key={capability}>
                <dt>{label}</dt>
                <dd data-allowed={allowed}>{allowed ? "できる" : "できない"}</dd>
              </div>
            );
          })}
        </dl>
      </Section>
    </main>
  );
}
