import type { Database } from "@/lib/database.types";

export type ReviewNotificationKind = Database["public"]["Enums"]["review_notification_kind"];

const labels: Record<ReviewNotificationKind, string> = {
  organization_application_approved: "Organization申請が承認されました",
  organization_application_rejected: "Organization申請が却下されました",
  event_revision_approved: "Event Revisionが承認・公開されました",
  event_revision_changes_requested: "Event Revisionに変更依頼があります",
  event_cancellation_approved: "Eventの中止申請が承認されました",
  event_cancellation_changes_requested: "Eventの中止申請に変更依頼があります",
};

export function reviewNotificationLabel(kind: ReviewNotificationKind) {
  return labels[kind];
}

export function reviewNotificationHref(notification: {
  event_id: string | null;
  kind: ReviewNotificationKind;
}) {
  if (notification.event_id && notification.kind === "event_cancellation_approved") {
    return `/events/${notification.event_id}`;
  }

  return "/workspace";
}
