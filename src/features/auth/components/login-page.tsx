import Link from "next/link";

import { login } from "@/features/auth/commands";
import { Notice } from "@/ui/notice";

import { AuthFrame } from "./auth-frame";

const errorMessages: Record<string, string> = {
  "invalid-credentials": "メールアドレスまたはパスワードを確認してください。",
  "missing-credentials": "メールアドレスとパスワードを入力してください。",
  "link-invalid": "メールのリンクが無効か、有効期限が切れています。パスワードの再設定は、もう一度依頼してください。招待のリンクは、運営に送り直しを依頼してください。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const message = params.error ? errorMessages[params.error] : undefined;

  return (
    <AuthFrame labelledBy="login-title">
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
      <Link className="text-link" href="/password/forgot">パスワードを忘れた場合</Link>
      <Link className="text-link" href="/">公開ページへ戻る</Link>
    </AuthFrame>
  );
}
