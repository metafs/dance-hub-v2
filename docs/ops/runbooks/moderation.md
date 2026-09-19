# Runbook — 審査と掲載取り下げ

**Status:** Draft
**Last Updated:** 2026-09-19
**リハーサル:** 一部のみ（審査導線は `tests/e2e/m4-event-review.spec.ts` で被覆。取り下げは未実施）

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

### 実装が無い

ADR-0018 は `withdrawn` 状態を決定したが、**スキーマにも UI にも実装されていない。**
ADR 本文が「migration は本 ADR とは別に行う」としたまま、その migration がまだ無い。

したがって現状の取り下げは **直接 SQL による手作業である。** 以下は実装が入るまでの
暫定手順であり、実装を不要にするものではない。

### 手順

```sql
-- 公開ポインタを外す。1 文で公開面から消える。
update public.events
  set published_revision_id = null
  where id = '<event-id>';
```

この 1 文で十分な理由: anon の RLS はすべて
`is_current_published_event_revision(published_revision_id)` を経由する。ポインタが
null になると、Event 本体・Revision・Schedule・出演者・チケット・リンク・メディアの
すべてが同時に不可視になる。一覧・検索・直 URL・sitemap のいずれからも到達しない。
Revision 行は残るので、承認履歴と集計母数は失われない（ADR-0018 の要求）。

実行後に確認する:

- `/events/{id}` が 404 になる
- `/events` と `/sitemap.xml` に出ない
- `/events/{id}/image` が 404 になる。ただし **最大 1 時間はキャッシュから配信されうる**
  （`max-age=3600`）。権利申し立てなど即時停止が必要な場合は
  [media-recovery.md](media-recovery.md) のキャッシュパージを併用する

### この手順の危険

1. **次の承認で静かに元に戻る。** `approve_event_revision` は無条件に
   `published_revision_id` を設定する。主催者が新しい Revision を出し、別の管理者が
   承認すると、取り下げは解除される。取り下げた Event は記録し、審査時に照合すること。
   これは運用では埋めきれない。実装が必要な理由そのものである。
2. **監査ログに書けない。** `event_review_action` enum に取り下げに当たる値が無く、
   `actor_id` は NOT NULL である。正直な監査行を書く手段が無い。対応記録はリポジトリ外に
   残し、実装時に遡って補うこと。
3. **主催者には通知されない。** 通知は審査関数からしか発火しない。手動で連絡する。

### 出演者本人からの削除要請

Event 全体を取り下げない。当該箇所のみを消す（ADR-0018、listing-policy F）。Event の
存在は `published` のまま維持する。

正規の経路は、主催者が当該クレジットを外した Revision を提出し、管理者が承認すること
である。主催者が応じない、または緊急の場合は、公開中 Revision の
`public.event_artists` 行を直接削除する。氏名ではなく画像が対象であれば
[media-recovery.md](media-recovery.md) の「オブジェクトが失われた場合」末尾の手順で
メイン画像のポインタを外す。

直接操作は審査履歴に残らない。上記 2 と同じ制約が当てはまる。

## 未解決

- **`withdrawn` が未実装。** ADR-0018 と listing-policy F が約束した運用を、実装が
  果たしていない。取り下げは手作業であり、次の承認で解除されうる。リリース前に実装する
  べき最上位の欠落である。
- 取り下げを表す監査アクションが無い。
- 管理者のブートストラップに UI が無く、手順が未検証である。
- 取り下げ済み Event の一覧を得る手段が無い（`published_revision_id is null` は下書き
  しか持たない Event と区別がつかない）。
