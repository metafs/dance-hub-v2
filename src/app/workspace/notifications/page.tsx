import type { Metadata } from "next";
import Link from "next/link";

import {
  markAllReviewNotificationsRead,
  markReviewNotificationRead,
} from "@/app/workspace/notifications/actions";
import { requireUser } from "@/features/auth/policy";
import { formatTokyoDateTime } from "@/lib/datetime";
import { reviewNotificationHref, reviewNotificationLabel } from "@/lib/review-notifications";
import { EmptyState } from "@/ui/empty-state";
import { AppPageHead } from "@/ui/page-head";
import { StateLabel } from "@/ui/state-label";

export const metadata: Metadata = { title: "審査結果の通知" };

export default async function ReviewNotificationsPage() {
  const { supabase, user } = await requireUser();
  const { data: notifications, error } = await supabase
    .from("review_notifications")
    .select("id, kind, subject, decision_reason, event_id, read_at, created_at")
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error("通知を読み込めませんでした。");
  const hasUnread = notifications.some((notification) => notification.read_at === null);

  return (
    <main className="container-app app-main container-narrow">
      <AppPageHead
        actions={hasUnread ? (
          <form action={markAllReviewNotificationsRead}>
            <button className="button button-quiet button-small" type="submit">すべて既読にする</button>
          </form>
        ) : null}
        description="Organization申請、Eventの公開、中止申請の審査結果が届きます。"
        title="審査結果の通知"
      />

      {notifications.length ? (
        <div className="panels">
          {notifications.map((notification) => (
            <article
              className={notification.read_at ? "review-item" : "review-item panel-strong"}
              key={notification.id}
            >
              <div className="review-item-head">
                <div className="review-item-title">
                  <span className="review-item-sub tabular">
                    {formatTokyoDateTime(notification.created_at)}
                  </span>
                  <h2>{reviewNotificationLabel(notification.kind)}</h2>
                </div>
                <StateLabel tone={notification.read_at ? "quiet" : "solid"}>
                  {notification.read_at ? "既読" : "未読"}
                </StateLabel>
              </div>
              <p><strong>{notification.subject}</strong></p>
              {notification.decision_reason ? <p>{notification.decision_reason}</p> : null}
              <div className="button-row">
                <Link className="text-link" href={reviewNotificationHref(notification)}>対象を確認 →</Link>
                {notification.read_at === null ? (
                  <form action={markReviewNotificationRead}>
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <button className="button button-quiet button-small" type="submit">既読にする</button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>審査結果の通知はまだありません。</EmptyState>
      )}
    </main>
  );
}
