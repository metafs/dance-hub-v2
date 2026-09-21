import Link from "next/link";

import { logout } from "@/features/auth/commands";
import { requireUser } from "@/features/auth/policy";
import { Logotype } from "@/ui/logotype";

/** The frame of every signed-in Organizer page, with the unread notice count. */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { count: unreadCount, error } = await supabase
    .from("review_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) throw new Error("通知件数を読み込めませんでした。");

  return (
    <div className="app">
      <header className="app-header">
        <div className="container-app app-header-bar">
          <div className="app-identity">
            <Link href="/workspace"><Logotype /></Link>
            <span className="app-identity-sub">主催者</span>
          </div>
          <div className="app-account">
            {/* The name keeps the count in words, the badge shows it at a glance. */}
            <Link
              aria-label={unreadCount ? `通知 (${unreadCount})` : "通知"}
              className="text-link"
              href="/workspace/notifications"
            >
              通知
              {unreadCount ? <span aria-hidden="true" className="count-badge">{unreadCount}</span> : null}
            </Link>
            <Link className="text-link" href="/">公開ページ</Link>
            <span className="app-account-email">{user.email}</span>
            <form action={logout}>
              <button className="button button-quiet button-small" type="submit">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
