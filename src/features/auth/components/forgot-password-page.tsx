import Link from "next/link";

import { requestPasswordReset } from "@/features/auth/commands";
import { Notice } from "@/ui/notice";

import { AuthFrame } from "./auth-frame";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthFrame labelledBy="forgot-title">
      <p className="page-meta"><span>主催者・運営</span></p>
      <h1 id="forgot-title">パスワードの再設定</h1>
      {params.sent ? (
        <Notice role="status" tone="success">
          入力したメールアドレスにアカウントがあれば、再設定のリンクを送りました。メールのリンクから新しいパスワードを決めてください。
        </Notice>
      ) : (
        <>
          <p>ログインに使っているメールアドレスを入力してください。パスワードを決め直すためのリンクを送ります。</p>
          {params.error === "invalid-email" ? <Notice tone="error">メールアドレスの形式を確認してください。</Notice> : null}
          <form action={requestPasswordReset} className="form-stack">
            <label>
              メールアドレス
              <input autoComplete="email" name="email" required type="email" />
            </label>
            <button className="button button-primary" type="submit">
              再設定のリンクを送る
            </button>
          </form>
        </>
      )}
      <Link className="text-link" href="/login">ログインへ戻る</Link>
    </AuthFrame>
  );
}
