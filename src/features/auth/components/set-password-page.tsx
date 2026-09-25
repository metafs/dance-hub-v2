import { setPassword } from "@/features/auth/commands";
import { requireUser } from "@/features/auth/policy";
import { minimumPasswordLength } from "@/features/auth/schema";
import { Notice } from "@/ui/notice";

import { AuthFrame } from "./auth-frame";

const errorMessages: Record<string, string> = {
  "too-short": `パスワードは${minimumPasswordLength}文字以上にしてください。`,
  "too-long": "パスワードが長すぎます。半角72文字以内にしてください。",
  mismatch: "確認のために入力したパスワードが一致しません。",
  "same-password": "今のパスワードと違うものにしてください。",
  "weak-password": "推測されやすいパスワードです。別のものにしてください。",
  "update-failed": "パスワードを保存できませんでした。もう一度お試しください。",
};

/**
 * Where an invitation or a reset link lands once verified (ADR-0025), and
 * where a signed-in user changes their password.
 */
export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; welcome?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();
  const welcome = params.welcome === "1";
  const message = params.error ? errorMessages[params.error] : undefined;

  return (
    <AuthFrame labelledBy="password-title">
      <p className="page-meta"><span>{user.email}</span></p>
      <h1 id="password-title">パスワードを決める</h1>
      <p>
        {welcome
          ? "p8ce へようこそ。ログインに使うパスワードを決めると、Organization の申請を始められます。"
          : "次回からのログインに使うパスワードを決めてください。"}
      </p>
      {message ? <Notice tone="error">{message}</Notice> : null}
      <form action={setPassword} className="form-stack">
        {welcome ? <input name="welcome" type="hidden" value="1" /> : null}
        <input autoComplete="username" hidden name="username" readOnly type="email" value={user.email ?? ""} />
        <label>
          新しいパスワード
          <span className="field-help">{minimumPasswordLength}文字以上</span>
          <input autoComplete="new-password" minLength={minimumPasswordLength} name="password" required type="password" />
        </label>
        <label>
          新しいパスワード（確認）
          <input autoComplete="new-password" minLength={minimumPasswordLength} name="passwordConfirmation" required type="password" />
        </label>
        <button className="button button-primary" type="submit">
          パスワードを保存する
        </button>
      </form>
    </AuthFrame>
  );
}
