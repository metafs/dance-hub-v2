import { inviteOrganizer } from "@/features/moderation/commands";
import { requirePlatformAdmin } from "@/features/moderation/policy";
import { Notice } from "@/ui/notice";
import { AppPageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";
import { mainContentId } from "@/ui/skip-link";

const errorMessages: Record<string, string> = {
  "invalid-email": "メールアドレスの形式を確認してください。",
  "already-registered": "このメールアドレスは、すでにアカウントを持っています。パスワードを忘れた場合は、ログイン画面から再設定できます。",
  "invite-failed": "招待メールを送れませんでした。時間をおいて、もう一度お試しください。",
};

/**
 * The Platform Admin's invitation form (ADR-0025). During the closed beta an
 * Organizer account exists only if it was invited here.
 */
export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const params = await searchParams;
  await requirePlatformAdmin();

  return (
    <main id={mainContentId} className="container-app app-main container-narrow">
      <AppPageHead
        description="クローズドβの間、主催者のアカウントは招待でのみ作れます。招待された人はメールのリンクからパスワードを決め、Workspace から Organization を申請します。"
        title="主催者を招待"
      />
      {params.error && errorMessages[params.error] ? <Notice tone="error">{errorMessages[params.error]}</Notice> : null}
      {params.invited ? <Notice role="status" tone="success">招待メールを送りました。</Notice> : null}

      <Section id="invite" rule size="small" title="招待メールを送る">
        <form action={inviteOrganizer} className="form-panel">
          <p className="field-help">
            リンクには有効期限があります。期限が切れた場合や届かない場合は、同じアドレスをもう一度招待してください。
          </p>
          <div className="field">
            <label htmlFor="invite-email">メールアドレス</label>
            <input autoComplete="off" id="invite-email" name="email" required type="email" />
          </div>
          <div><button className="button button-primary" type="submit">招待メールを送る</button></div>
        </form>
      </Section>
    </main>
  );
}
