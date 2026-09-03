import Link from "next/link";

import {
  markAllReviewNotificationsRead,
  markReviewNotificationRead,
} from "@/app/workspace/notifications/actions";
import { requireUser } from "@/features/auth/policy";
import { reviewNotificationHref, reviewNotificationLabel } from "@/lib/review-notifications";

const tokyoDateTime = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Tokyo",
});

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
    <main className="workspace-main">
      <section className="section-block" aria-labelledby="notifications-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Review inbox</p>
            <h1 id="notifications-title">審査結果の通知</h1>
            <p className="lede">Organization申請、Event公開、中止申請の審査結果を確認できます。</p>
          </div>
          {hasUnread ? (
            <form action={markAllReviewNotificationsRead}>
              <button className="button button-quiet" type="submit">すべて既読にする</button>
            </form>
          ) : null}
        </div>

        {notifications.length ? (
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                className={`review-card notification-card${notification.read_at ? "" : " notification-unread"}`}
                key={notification.id}
              >
                <div>
                  <span className="status">{notification.read_at ? "既読" : "未読"}</span>
                  <h2>{reviewNotificationLabel(notification.kind)}</h2>
                  <p><strong>{notification.subject}</strong></p>
                  {notification.decision_reason ? <p>{notification.decision_reason}</p> : null}
                  <p className="muted">{tokyoDateTime.format(new Date(notification.created_at))}</p>
                </div>
                <div className="button-row">
                  <Link className="text-link" href={reviewNotificationHref(notification)}>対象を確認 →</Link>
                  {notification.read_at === null ? (
                    <form action={markReviewNotificationRead}>
                      <input name="notificationId" type="hidden" value={notification.id} />
                      <button className="button button-quiet" type="submit">既読にする</button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">審査結果の通知はまだありません。</div>
        )}
      </section>
    </main>
  );
}
