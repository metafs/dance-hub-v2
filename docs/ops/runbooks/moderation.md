# Runbook — 審査と掲載取り下げ

**Status:** Draft
**Last Updated:** 2026-09-19
**リハーサル:** 一部のみ（審査導線は `tests/e2e/m4-event-review.spec.ts`、取り下げは `supabase/tests/database/event_withdrawal.test.sql` で被覆。本番環境では未実施）

判断基準は `docs/product/listing-policy.md` にある。本 runbook は**操作**だけを扱う。
掲載可否そのものを迷ったら listing-policy を読むこと。ADR-0017 のとおり、審査で作品の
質は判断しない。

## 権限

審査操作はすべて `public.is_platform_admin()` を要求する。管理者であることは
`public.platform_admins` に行があることと同値である。

**最初の管理者はアプリケーションから作れない。** `platform_admins` の RLS は管理者にしか
書き込みを許さないため、一人目は service role で直接 insert する必要がある。

```sql
insert into public.platform_admins (user_id)
values ('<auth.users の id>');
```

二人目以降は同じ insert を管理者の権限で行える。UI は無い。*未検証* — 本番での実行は
未経験である。本番の初期設定でこれが最初の作業になる。

## 日常の審査

| 画面 | 対象 | 承認 | 却下・差し戻し |
| --- | --- | --- | --- |
| `/admin/applications` | Organization 申請 | `approve_organization_application` | `reject_organization_application` |
| `/admin/entities` | Artist / Venue 候補と変更要求 | `activate_*_candidate`, `approve_*_change_request` | `reject_*`, `merge_*_candidate` |
| `/admin/events` | Event Revision と中止申請 | `approve_event_revision`, `approve_event_cancellation` | `request_event_revision_changes`, `request_event_cancellation_changes` |
| `/admin/withdrawals` | 掲載の取り下げ要請 | `restore_event`（復帰） | `withdraw_event`（取り下げ） |

理由は省略できない。`require_moderation_reason` が空文字と空白のみを拒否する。理由は
主催者への通知に載る（ADR-0014）。

Revision を承認すると `approve_event_revision` が一つのトランザクションで次を行う。

1. 直前の公開 Revision を `superseded` にする
2. 承認する Revision を `approved` にし、審査者と日時を記録する
3. `events.published_revision_id` を新しい Revision に向ける
4. `event_revision_audit_log` に 2 行（supersede と approve）を書く

公開面はすべてこの `published_revision_id` を見ている。**承認は公開と同じ操作である。**

## 中止

中止は主催者が申請し、管理者が承認する（`request_event_cancellation` →
`approve_event_cancellation`）。承認後、Event は `cancelled` として **公開されたまま**
中止の事実と理由を表示する。一覧からも消えない。

これは意図された挙動である。チケット購入者にとって中止の事実は実害のある情報であり、
主催者の都合で消えることは観客の不利益になる（ADR-0018）。

主催者が中止情報そのものの掲載を望まない場合、中止ではなく **取り下げ** として扱う。

## 取り下げ（F-1 〜 F-5）

listing-policy F の五つの事由に該当する場合、掲載を取り下げる。

### 手順

`/admin/withdrawals` で行う。取り下げ要請は公開ページの URL とともに届くので、その末尾
の Event ID と理由を入力する。理由は内部記録であり、公開されない。

取り下げると、Event 本体・Revision・Schedule・出演者・チケット・リンク・メディアの
すべてが同時に不可視になる。一覧・検索・直 URL・sitemap のいずれからも到達しない。
anon の RLS がすべて `is_current_published_event_revision` を経由しており、その関数が
`withdrawn_at is null` を要求するためである。Revision 行は残るので、承認履歴と集計母数は
失われない（ADR-0018 の要求）。

実行後に確認する:

- `/events/{id}` が 404 になる
- `/events` と `/sitemap.xml` に出ない
- `/events/{id}/image` が 404 になる。ただし **最大 1 時間はキャッシュから配信されうる**
  （`max-age=3600`）。権利申し立てなど即時停止が必要な場合は
  [media-recovery.md](media-recovery.md) のキャッシュパージを併用する

取り下げ中の Event は Revision を審査に出せない。`assert_event_not_withdrawn` が status
遷移を拒否するため、あとから承認して公開に戻ってしまうことはない。

### 誤って取り下げたとき

同じ画面の「取り下げ済み」一覧から復帰できる。復帰も理由が必須で、取り下げと復帰の
両方が `event_revision_audit_log` に `event_withdrawn` / `event_restored` として残る。

### 残っている制約

- **主催者には通知されない。** 通知は審査関数からしか発火しない。手動で連絡する。
- **Festival の親子は連動しない。** 公開中 Festival の唯一の子を取り下げると、親は
  プログラムが空のまま公開され続ける。掲載基準 F-1 が理由を問わず応じると定めている
  以上、Festival の制約で取り下げを拒否することはできない。親も取り下げるべきかは
  ADR-0018 が答えていない。運用では、子を取り下げるときに親の状態を確認すること。

### 出演者本人からの削除要請

Event 全体を取り下げない。当該箇所のみを消す（ADR-0018、listing-policy F）。Event の
存在は `published` のまま維持する。

正規の経路は、主催者が当該クレジットを外した Revision を提出し、管理者が承認すること
である。主催者が応じない、または緊急の場合は、公開中 Revision の
`public.event_artists` 行を直接削除する。氏名ではなく画像が対象であれば
[media-recovery.md](media-recovery.md) の「オブジェクトが失われた場合」末尾の手順で
メイン画像のポインタを外す。

直接操作は審査履歴に残らない。Event 全体の取り下げと違い、部分削除には専用の操作も監査
アクションも無い。実施した場合は対応記録を別途残すこと。

## 未解決

- 管理者のブートストラップに UI が無く、手順が未検証である。
- 取り下げ時に主催者へ自動通知されない。
- Festival の親子が連動しない（上記）。
