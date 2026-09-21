import Link from "next/link";

import { login } from "@/features/auth/commands";
import { Logotype } from "@/ui/logotype";
import { Notice } from "@/ui/notice";

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
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link aria-label="p8ce（ペイス）トップ" className="site-header-home" href="/">
            <Logotype reading="ペイス" />
          </Link>
        </div>
      </header>
      <main className="container auth-main">
        <section aria-labelledby="login-title" className="auth-panel">
          <p className="page-meta"><span>主催者・運営</span></p>
          <h1 id="login-title">ログイン</h1>
          <p>Organizationの申請、Eventの掲載と更新、審査を行います。</p>
          {message ? <Notice tone="error">{message}</Notice> : null}
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
          <Link className="text-link" href="/">公開ページへ戻る</Link>
        </section>
      </main>
    </>
  );
}
