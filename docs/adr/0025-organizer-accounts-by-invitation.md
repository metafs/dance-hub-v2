# ADR-0025: 主催者のアカウントは、β の間は招待で作る

**Status:** Accepted
**Accepted:** 2026-09-25

## Context

2026-09-24 の監査で、主催者がアカウントを作る手段がないことが分かった。アプリにあるのはログインとログアウトだけで、seed のユーザーでしかログインできず、パスワードを忘れた人も戻れない。一方で `supabase/config.toml` は新規登録（signup）を止めていないため、公開されている publishable key で Supabase Auth の `/auth/v1/signup` を直接呼べば、画面がなくてもアカウントを作れる状態だった。

ロードマップは二つのことを前提にしている。M8 は「招待した Organizer 3〜5 団体でクローズドβを行う」とし、MVP outcome は掲載在庫を「Organizer の自己申請」で確保するとしている。ロードマップ v0.7 はこれを DEC-R9 として未決に置いた。

## Decision

2026-09-25 に DEC-R9 として決定した。

1. **クローズドβの間、主催者のアカウントは Platform Admin の招待でのみ作る。** `/admin/invitations` から Supabase Auth の招待メールを送る。招待された人はメールのリンクからパスワードを決め、Workspace から Organization を申請する。申請と承認の流れ（ADR-0006）は変えない。
2. **Supabase Auth の新規登録は止める。** ローカルは `supabase/config.toml` の `enable_signup = false`、本番は Dashboard の「Allow new users to sign up」を off にする。招待はこの設定に関係なく使える。
3. **パスワードの再設定は、ログイン画面から誰でも依頼できる。** 登録されていないメールアドレスでも同じ応答を返し、アカウントの有無を明かさない。
4. **一般公開の前に、誰でも登録できる画面（メールアドレスの確認つき）を加え、2 を戻す。** ロードマップで追跡する。
5. **メールのリンクは、どれも `/auth/confirm?token_hash=…&type=…` に着く。** 行き先は種類（`invite`・`recovery`）ごとにアプリが決め、リンクに行き先の URL を載せない。メールの文面は `supabase/templates/` に置く。

## Alternatives considered

- **最初から誰でも登録できるようにする:** 自己申請の形に最も近い。しかし β で受け入れる団体を絞れず、登録だけのアカウントやスパム登録の後始末が、審査の上限（G-2）と同じ運営の手に乗る。
- **招待だけを続ける:** 運営の管理は最も簡単だが、主催者が運営に連絡しないと申請を始められず、MVP の「自己申請」と食い違う。

## Consequences

- 本番では Supabase Auth のメール送信に独自の SMTP が要る。Supabase 標準の送信は試験用で、送れる数が厳しく制限される。SMTP の提供元は未決（ロードマップ）。
- 本番の Supabase の Site URL を `https://p8ce.dance` にする。メールのリンクはこの URL を起点に作られる。`supabase/templates/` の文面を Dashboard の Email Templates にも設定する（`docs/ops/runbooks/deployment.md`）。
- 招待したことは Supabase Auth の `invited_at` に残るが、誰が招待したかは残らない。
- パスワード再設定の依頼は、他人のアドレスにメールを送らせることに使われうる。Supabase の送信間隔の制限（同じ宛先に 60 秒に 1 通）に頼る。
- 招待と再設定のメールを使う E2E は、ローカルの Supabase に含まれるメールサーバー（Mailpit）からリンクを読む。

## Revisit when

- 一般公開の前（Decision 4 の実装）。
- 招待の数が増え、誰が誰を招待したかの記録が必要になったとき。
