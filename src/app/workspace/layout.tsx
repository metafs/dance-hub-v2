import Link from "next/link";

import { logout } from "@/app/login/actions";
import { requireUser } from "@/lib/auth/authorization";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { count: unreadCount, error } = await supabase
    .from("review_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) throw new Error("通知件数を読み込めませんでした。");

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="wordmark" href="/workspace">
          DANCE HUB
        </Link>
        <div className="account-menu">
          <Link className="text-link" href="/workspace/notifications">
            通知{unreadCount ? ` (${unreadCount})` : ""}
          </Link>
          <span>{user.email}</span>
          <form action={logout}>
            <button className="button button-quiet" type="submit">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
