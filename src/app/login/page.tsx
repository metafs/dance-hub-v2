import Link from "next/link";

import { login } from "./actions";

const errorMessages: Record<string, string> = {
  "invalid-credentials": "メールアドレスまたはパスワードを確認してください。",
  "missing-credentials": "メールアドレスとパスワードを入力してください。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const message = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="login-title">
        <Link className="wordmark" href="/">
          DANCE HUB
        </Link>
        <p className="eyebrow">Organizer / Platform Admin</p>
        <h1 id="login-title">ログイン</h1>
        <p className="lede">Organizationの申請、審査、Event管理を始めます。</p>
        {message ? (
          <p className="notice notice-error" role="alert">
            {message}
          </p>
        ) : null}
        <form action={login} className="form-stack">
          <input name="next" type="hidden" value={params.next ?? "/workspace"} />
          <label>
            メールアドレス
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            パスワード
            <input autoComplete="current-password" minLength={8} name="password" required type="password" />
          </label>
          <button className="button button-primary" type="submit">
            ログイン
          </button>
        </form>
      </section>
    </main>
  );
}
