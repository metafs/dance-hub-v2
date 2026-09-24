import Link from "next/link";

import { requireOrganizationCapability } from "@/features/organizations/policy";
import { eventTypeLabel, isEventType, revisionStatusLabel } from "@/features/revisions/schema";
import { getRevisionListData } from "@/features/revisions/queries";
import { formatTokyoDate } from "@/lib/datetime";
import { EmptyState } from "@/ui/empty-state";
import { AppPageHead } from "@/ui/page-head";
import { Mark, StateLabel } from "@/ui/state-label";
import { TableFrame } from "@/ui/table-frame";

type RevisionRow = {
  id: string;
  event_id: string;
  title: string;
  event_type: string | null;
  status: string;
  created_at: string;
};

const openStatuses = new Set(["draft", "in_review", "changes_requested"]);

/**
 * One row per Event rather than per Revision. The newest Revision names the
 * Event; whether any Revision was approved says whether a public page exists
 * (REQ-EVENT-005: approving a Revision moves the published pointer).
 */
function eventsFromRevisions(revisions: readonly RevisionRow[]) {
  const byEvent = new Map<string, RevisionRow[]>();
  for (const revision of revisions) {
    byEvent.set(revision.event_id, [...(byEvent.get(revision.event_id) ?? []), revision]);
  }

  return [...byEvent.entries()].map(([eventId, eventRevisions]) => {
    const [latest] = eventRevisions;
    const open = eventRevisions.find((revision) => openStatuses.has(revision.status)) ?? null;
    return {
      eventId,
      latest,
      open,
      published: eventRevisions.some((revision) => revision.status === "approved"),
    };
  });
}

export default async function EventListPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const [{ data: revisions }] = await getRevisionListData(supabase);
  const events = eventsFromRevisions((revisions ?? []) as RevisionRow[]);
  const returned = events.filter((item) => item.open?.status === "changes_requested");
  const base = `/workspace/${organizationId}/events`;

  return (
    <main className="container-app app-main">
      <AppPageHead
        actions={<Link className="button button-primary" href={`${base}/new`}>新しいEventを作成</Link>}
        description="公開には運営の審査が必要です。審査で確認するのは記載の形式と権利だけで、内容の良し悪しは判断しません。"
        title="Event"
      />

      {returned.map((item) => (
        <div className="callout" key={item.eventId}>
          <div>
            <p className="callout-title">差し戻されています：{item.latest.title}</p>
            <p className="callout-detail">運営からのコメントを確認し、直して再提出してください。</p>
          </div>
          <Link className="text-link" href={`${base}/${item.eventId}?revision=${item.open?.id}`}>
            直して再提出する
          </Link>
        </div>
      ))}

      {events.length ? (
        <TableFrame label="Event">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">公開ページ</th>
                <th scope="col">編集中の版</th>
                <th scope="col">更新</th>
              </tr>
            </thead>
            <tbody>
              {events.map((item) => (
                <tr key={item.eventId}>
                  <td>
                    <div className="table-title">
                      <Link href={`${base}/${item.eventId}?revision=${(item.open ?? item.latest).id}`}>
                        {item.latest.title}
                      </Link>
                      <span className="table-sub">
                        {item.latest.event_type && isEventType(item.latest.event_type)
                          ? eventTypeLabel(item.latest.event_type)
                          : "種別未設定"}
                      </span>
                    </div>
                  </td>
                  <td>
                    {item.published
                      ? <Mark shape="filled">公開中</Mark>
                      : <Mark shape="open">未公開</Mark>}
                  </td>
                  <td>
                    {item.open ? (
                      <StateLabel tone={item.open.status === "changes_requested" ? "solid" : item.open.status === "in_review" ? "dashed" : "quiet"}>
                        {revisionStatusLabel(item.open.status)}
                      </StateLabel>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td className="tabular muted">{formatTokyoDate(item.latest.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      ) : (
        <EmptyState>まだEventがありません。「新しいEventを作成」から下書きを作ります。</EmptyState>
      )}
      <p className="section-note table-note">● 公開中　○ 未公開。中止になったEventも公開ページに中止として残ります。</p>
    </main>
  );
}
