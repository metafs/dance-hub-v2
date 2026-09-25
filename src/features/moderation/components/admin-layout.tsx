import Link from "next/link";

import { logout } from "@/features/auth/commands";
import { requirePlatformAdmin } from "@/features/moderation/policy";
import { Logotype } from "@/ui/logotype";
import { TabNav, type TabItem } from "@/ui/tab-nav";

const queues: readonly TabItem[] = [
  { href: "/admin/events", label: "Event" },
  { href: "/admin/applications", label: "Organization申請" },
  { href: "/admin/entities", label: "出演者・会場" },
  { href: "/admin/withdrawals", label: "依頼・取り下げ" },
  { href: "/admin/invitations", label: "招待" },
];

/**
 * The Platform Admin frame. It is set in the inverse colours so an admin can
 * tell at a glance that a decision here changes what the public sees.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePlatformAdmin();

  return (
    <div className="app app-inverse">
      <header className="app-header">
        <div className="container-app app-header-bar">
          <div className="app-identity">
            <Link href="/admin/events"><Logotype /></Link>
            <span className="app-identity-sub">運営</span>
          </div>
          <div className="app-account">
            <Link href="/workspace">Workspace</Link>
            <span className="app-account-email">{user.email}</span>
            <form action={logout}>
              <button className="button button-small" type="submit">ログアウト</button>
            </form>
          </div>
        </div>
        <div className="container-app">
          <TabNav items={queues} label="審査キュー" />
        </div>
      </header>
      {children}
    </div>
  );
}
