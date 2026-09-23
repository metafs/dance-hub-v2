# p8ce — 法務文書の要件 / Legal Requirements

**Status:** Draft
**Last Updated:** 2026-09-23

## Purpose

MVP ロードマップ v0.4 の M7（DH-30〜DH-32）で公開する利用規約・プライバシーポリシー・運営者情報について、**何を書かなければならないか**を、既に決まった仕様から列挙する。

本書は条文ではない。条文の起草と確定は法的助言を受けて行う（ロードマップ M7）。エージェントは本書を根拠に条文を一般論で埋めてはならない。本書の各項目は、実装または決定済みの文書を出典として持つ。出典のない項目は「未決」に置く。

掲載基準の公開ページ（DH-33、`/listing-policy`）は `docs/product/listing-policy.md` の決定を述べるもので、本書の対象ではない。

## 利用規約（DH-30）

| 項目 | 決まっていること | 出典 |
| --- | --- | --- |
| 掲載の審査 | 形式要件と権利要件のみで判断し、作品の質を判断しない。不承認は条文番号で通知する | listing-policy 原則・G-3、ADR-0017 |
| 掲載の削除 | 主催者の求めには理由を問わず応じる。`withdrawn` は利用規約上「削除」と表現する | listing-policy F、ADR-0018 |
| 中止の扱い | 中止・延期は中止として掲載を続ける。中止情報の掲載を望まない場合は削除として扱う | listing-policy F |
| 出演者本人の要請 | 氏名・画像の削除は該当箇所のみに対して行う | listing-policy F |
| 画像の権利保証 | 画像の利用許諾（C-2）、写っている人物の許諾（C-3）を投稿者が保証する。画像アップロード画面の同意文言はこの条文に依存する | listing-policy C-2〜C-4、ADR-0016 |
| 他者の氏名 | 本人の了承なく出演者として掲載しない | listing-policy C-4 |
| 運営による代理掲載 | 公開情報のみ、掲載後の通知、申し出への即時対応、画像を転載しない | listing-policy C-5〜C-8 |
| 禁止事項 | 掲載しないもの（D-1〜D-6）。この一覧は増やさない | listing-policy D |
| 主催者アカウント | Organization 申請と承認、Owner / Admin / Editor の権限 | ADR-0006、`docs/architecture/auth.md` |
| チケット・申込 | p8ce はチケットを販売せず、料金を計算しない。購入・申込は外部サイトで行われる | ADR-0011 |

## プライバシーポリシー（DH-31）

実装が取得・保存している情報。条文はこの一覧と一致していなければならない。

| 情報 | 取得する場面 | 保存先 | 公開 | 出典 |
| --- | --- | --- | --- | --- |
| メールアドレス、パスワード（ハッシュ） | 主催者・運営のログイン | Supabase Auth | しない | `src/features/auth/commands.ts` |
| 責任者、連絡先、活動確認 URL | Organization 申請 | Supabase（`organization_applications`） | しない | `20260921000000_listing_policy_followups.sql`、listing-policy E-1〜E-3 |
| 団体名 | Organization 申請 | Supabase（`organizations`） | 公開 Event を持つ団体の名称のみ | `20260919000000_public_organization_read.sql` |
| 問い合わせ先（URL またはメール） | Event 申請 | Supabase（`event_revisions`） | 承認後に公開 | listing-policy B-5 |
| 依頼者の連絡先、依頼内容 | 掲載の削除・修正依頼 | Supabase（`listing_requests`） | しない | `20260921000000_listing_policy_followups.sql` |
| bot 判定のための情報 | 削除・修正依頼の送信時 | Cloudflare Turnstile が処理 | しない | `src/features/listing-requests/commands.ts` |
| 画像 | Event 申請 | Cloudflare R2（非公開バケット） | 承認後に配信経路からのみ | ADR-0016 |
| エラー記録（メソッド、パス、エラー内容） | サーバーエラー発生時 | Cloudflare Workers Logs | しない | ADR-0023 |

委託先として名前が挙がるもの: Supabase（データベース・認証）、Cloudflare（配信・画像保存・Turnstile・ログ）。

## 運営者情報（DH-32）

| 項目 | 決まっていること | 出典 |
| --- | --- | --- |
| 運営者が作家である旨の開示 | 運営関係者が関わる Event は同じ手続きで審査し、必要に応じてページで明示する | listing-policy G-5 |
| 問い合わせ窓口 | 掲載の削除・修正は `/listing-requests` で受け付ける | listing-policy F、DH-21 |

## 未決

エージェントが一般論で決めてはならない。決定したら出典を付けて上の表へ移す。

| 項目 | 影響 |
| --- | --- |
| 運営者として表示する名義・連絡先・所在地の範囲 | DH-32 |
| `listing_requests`・`organization_applications` の保存期間と削除の手順 | DH-31 |
| 利用者からの開示・訂正・削除請求の窓口と手順（掲載の削除依頼とは別） | DH-31 |
| Workers Logs の保存期間をポリシーに記載するか | DH-31、ADR-0023 |
| 規約の変更時の通知方法 | DH-30 |
| 準拠法・管轄、免責の範囲 | DH-30。法的助言が必要 |
| 利用規約への同意を取得する画面（Organization 申請時か、ログイン時か） | DH-30、M2 の申請フォーム |
