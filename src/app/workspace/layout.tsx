import Link from "next/link";

import { logout } from "@/app/login/actions";
import { requireUser } from "@/lib/auth/authorization";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="wordmark" href="/workspace">
          DANCE HUB
        </Link>
        <div className="account-menu">
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
