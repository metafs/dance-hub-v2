import Link from "next/link";

import { EventDraftForm } from "@/components/event-draft-form";
import { requireOrganizationCapability } from "@/lib/auth/authorization";

const errorMessages: Record<string, string> = {
  "create-failed": "下書きを作成できませんでした。権限と入力内容を確認してください。",
  "invalid-input": "日時、URL、画像メタデータの入力内容を確認してください。",
};

export default async function EventListPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { organizationId } = await params;
  const query = await searchParams;
  const { organization, supabase } = await requireOrganizationCapability(organizationId, "editEvents");
  const [{ data: revisions }, { data: artists }, { data: venues }] = await Promise.all([
    supabase.from("event_revisions").select("id, event_id, title, event_type, status, created_at").order("created_at", { ascending: false }),
    supabase.from("artists").select("id, name").order("name").limit(100),
    supabase.from("venues").select("id, name, prefecture").order("name").limit(100),
  ]);

  return <main className="workspace-main">
    <Link className="back-link" href={`/workspace/${organizationId}`}>← Workspaceへ戻る</Link>
    <section className="hero-card"><div><p className="eyebrow">Event workflow</p><h1>Event Draft</h1><p className="lede">{organization.name} のEventを下書きとして作成します。公開にはPlatform Adminの承認が必要です。</p></div></section>
    {query.error ? <p className="notice notice-error" role="alert">{errorMessages[query.error] ?? "保存できませんでした。"}</p> : null}
    <section className="section-block"><h2>作成済みのRevision</h2><div className="card-grid">{revisions?.map((revision) => <article className="entity-card" key={revision.id}><span className="status">{revision.status}</span><h3>{revision.title}</h3><Link className="text-link" href={`/workspace/${organizationId}/events/${revision.event_id}?revision=${revision.id}`}>編集する →</Link></article>)}</div></section>
    <section className="section-block"><EventDraftForm organizationId={organizationId} artists={artists ?? []} venues={venues ?? []} festivalParents={(revisions ?? []).filter((revision) => revision.event_type === "festival").map((revision) => ({ id: revision.event_id, title: revision.title }))}/></section>
  </main>;
}
