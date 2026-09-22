import Link from "next/link";
import { notFound } from "next/navigation";

import { requireOrganizationCapability } from "@/features/organizations/policy";
import { hasOrganizationCapability } from "@/features/organizations/schema";
import { cancellationStatusLabel, revisionStatusLabel } from "@/features/revisions/schema";
import { toTokyoDateTimeLocal } from "@/lib/datetime";
import {
  getRevisionContent,
  getRevisionEditOverview,
} from "@/features/revisions/queries";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { StateLabel, type StateLabelTone } from "@/ui/state-label";

import { EventRevisionForm } from "@/components/event-revision-form";
import { createNextEventRevisionDraft } from "@/features/revisions/commands";
import {
  requestEventCancellation,
  resubmitEventCancellation,
} from "@/features/events/commands";

const errors: Record<string, string> = {
  "save-failed": "この版は編集できません。審査中か、すでに承認されている可能性があります。",
  "content-save": "関連情報を保存できませんでした。",
  "not-ready": "提出の条件を満たしていません。説明、種別、問い合わせ先、料金・申込リンク・申込不要のいずれか、日程（初日の7日前までに提出）を確認してください。",
  "invalid-input": "日時、URL、画像の入力内容を確認してください。",
  "revision-create": "新しい版を作成できませんでした。編集中の版が残っていないか確認してください。",
  "cancellation-request": "中止申請を送信できませんでした。",
  "cancellation-resubmit": "中止申請を再提出できませんでした。",
};

const statusTones: Record<string, StateLabelTone> = {
  draft: "quiet",
  in_review: "dashed",
  changes_requested: "solid",
  approved: "outline",
  superseded: "quiet",
};

export default async function EventEditPage({ params, searchParams }: { params: Promise<{ organizationId: string; eventId: string }>; searchParams: Promise<{ revision?: string; created?: string; saved?: string; submitted?: string; cancellation?: string; error?: string }> }) {
  const { organizationId, eventId } = await params;
  const query = await searchParams;
  const { supabase, role } = await requireOrganizationCapability(organizationId, "editEvents");
  const [
    { data: revisions },
    { data: event },
    { data: cancellationRequest },
    { data: festivalRevisions },
  ] = await getRevisionEditOverview(supabase, eventId);
  const revision = query.revision ? revisions?.find((candidate) => candidate.id === query.revision) : revisions?.[0];
  if (!revision) notFound();
  const [
    { data: artists },
    { data: venues },
    { data: credit },
    { data: schedule },
    { data: ticketOffers },
    { data: ticket },
    { data: link },
    { data: image },
  ] = await getRevisionContent(supabase, revision.id);
  const defaults = { title: revision.title, description: revision.description, eventType: revision.event_type, applicationDeadline: toTokyoDateTimeLocal(revision.application_deadline), proposedParentEventId: revision.proposed_parent_event_id, noRegistrationRequired: revision.no_registration_required, contactKind: revision.contact_kind, contactValue: revision.contact_value, artistId: credit?.artist_id, artistRole: credit?.role, venueId: schedule?.venue_id, startsAt: toTokyoDateTimeLocal(schedule?.starts_at ?? null), endsAt: toTokyoDateTimeLocal(schedule?.ends_at ?? null), allDay: schedule?.all_day, ticketKind: ticket?.kind, ticketUrl: ticket?.url, ticketLabel: ticket?.label, externalUrl: link?.url, externalLabel: link?.label, imageAlt: image?.alt_text };
  const editable = revision.status === "draft" || revision.status === "changes_requested";
  const canRequestCancellation = hasOrganizationCapability(role, "requestCancellation");
  const canCreateNextDraft = Boolean(event?.published_revision_id) && !event?.cancelled_at && !revisions?.some((candidate) => ["draft", "in_review", "changes_requested"].includes(candidate.status));
  const eventsPath = `/workspace/${organizationId}/events`;

  const success = query.submitted
    ? "審査へ提出しました。"
    : query.cancellation
      ? "中止申請をPlatform Adminの審査へ送りました。"
      : query.created || query.saved
        ? "下書きを保存しました。"
        : null;

  return (
    <main className="container-app app-main container-narrow">
      <AppPageHead
        actions={event?.published_revision_id ? (
          <Link className="text-link" href={`/events/${eventId}`}>公開ページを見る</Link>
        ) : null}
        breadcrumb={<><Link href={eventsPath}>Event</Link><span>/</span><span>{revision.title}</span></>}
        description={event?.cancelled_at
          ? "このEventは中止として公開されています。"
          : event?.published_revision_id
            ? "公開中の内容は、新しい版が承認されるまでそのまま表示されます。"
            : "まだ公開されていません。審査で承認されると公開されます。"}
        title={revision.title}
      />

      <div className="revision-status">
        <StateLabel tone={statusTones[revision.status] ?? "quiet"}>{revisionStatusLabel(revision.status)}</StateLabel>
        <span className="muted">この版の状態</span>
      </div>

      {success ? <Notice tone="success">{success}</Notice> : null}
      {query.error ? <Notice tone="error">{errors[query.error] ?? "保存できませんでした。"}</Notice> : null}

      {editable ? (
        <EventRevisionForm organizationId={organizationId} eventId={eventId} revisionId={revision.id} artists={artists ?? []} venues={venues ?? []} festivalParents={(festivalRevisions ?? []).filter((parent) => parent.event_id !== eventId).map((parent) => ({ id: parent.event_id, title: parent.title }))} ticketOffers={(ticketOffers ?? []).map((offer) => ({ key: offer.id, priceType: offer.price_type, label: offer.label, currency: offer.currency, amountMinor: offer.amount_minor, minAmountMinor: offer.min_amount_minor, maxAmountMinor: offer.max_amount_minor, notes: offer.notes }))} hasMainImage={Boolean(image)} defaults={defaults}/>
      ) : (
        <Notice tone="info">この版は現在編集できません。運営の審査結果を待ってください。</Notice>
      )}

      {canCreateNextDraft ? (
        <Section id="revision-next" rule size="small" title="公開中のEventを更新">
          <p className="muted">公開中の内容をコピーして、新しい下書きを作成します。公開中のEventは、新しい版が承認されるまでそのまま表示され続けます。</p>
          <form action={createNextEventRevisionDraft}>
            <input name="organizationId" type="hidden" value={organizationId}/>
            <input name="eventId" type="hidden" value={eventId}/>
            <button className="button">次のRevisionを作成</button>
          </form>
        </Section>
      ) : null}

      {event?.published_revision_id && canRequestCancellation && !event.cancelled_at ? (
        <Section id="revision-cancellation" rule size="small" title="中止申請">
          <p className="muted">中止が承認されると、公開ページは削除されず「中止」として残ります。</p>
          {cancellationRequest ? (
            <div className="panel">
              <div className="panel-head">
                <StateLabel tone={cancellationRequest.status === "changes_requested" ? "solid" : "dashed"}>
                  {cancellationStatusLabel(cancellationRequest.status)}
                </StateLabel>
              </div>
              <p>申請理由：{cancellationRequest.requested_reason}</p>
              {cancellationRequest.decision_reason ? <p>運営からのコメント：{cancellationRequest.decision_reason}</p> : null}
              {cancellationRequest.status === "changes_requested" ? (
                <form action={resubmitEventCancellation} className="form-stack">
                  <input name="organizationId" type="hidden" value={organizationId}/>
                  <input name="eventId" type="hidden" value={eventId}/>
                  <input name="requestId" type="hidden" value={cancellationRequest.id}/>
                  <label>再提出する理由<textarea name="reason" defaultValue={cancellationRequest.requested_reason} rows={3} required maxLength={2000}/></label>
                  <div><button className="button button-danger">中止申請を再提出</button></div>
                </form>
              ) : null}
            </div>
          ) : (
            <form action={requestEventCancellation} className="form-panel">
              <input name="organizationId" type="hidden" value={organizationId}/>
              <input name="eventId" type="hidden" value={eventId}/>
              <label>中止理由<textarea name="reason" rows={3} required maxLength={2000}/></label>
              <div><button className="button button-danger">中止を申請</button></div>
            </form>
          )}
        </Section>
      ) : null}
    </main>
  );
}
