# Runbook — メディアの復旧

**Status:** Draft
**Last Updated:** 2026-09-19
**リハーサル:** 未実施

## 構造

メイン画像は二つの場所に分かれて存在する（ADR-0016）。

- **バイト列**: R2 バケット `dance-hub-media`。binding は `MEDIA`。
- **ポインタ**: `public.event_media` 行。`object_key`, `content_type`, `alt_text`。
  行は **Event Revision に属する**。Event ではない。

object key は `events/{eventId}/{uuid}.{jpg|png|webp}`（`mainImageObjectKey`）。
Event 単位で prefix が分かれているので、`events/{eventId}/` の list が、その Event に
関して書かれた全オブジェクトになる。

読み取り経路は `/events/{eventId}/image` ただ一つである。このルートは Event の
**承認済み Revision を先に解決してから** R2 を読む。バケットは private であり、object key
を知っていても直接は取得できない。

MVP は何も削除しない（ADR-0016）。Revision の下書き作成はオブジェクトを複製せず
object key を引き継ぐ。したがって **アプリケーションがオブジェクトを消すことはない。**
不整合は、書き込みの失敗か、人の手による削除か、バケットの設定違いで起きる。

## 症状から原因へ

| 症状 | 状態 | 原因 |
| --- | --- | --- |
| 公開ページで画像が壊れて表示される | `event_media` 行あり / オブジェクト無し | 書き込み失敗、手動削除、バケット違い |
| 画像の領域そのものが出ない | `event_media` 行が無い | 画像が未設定。障害ではない |
| 全 Event で画像が壊れる | binding が違うバケットを指している | 設定ミス。個別の復旧をしない |
| 未承認の画像が見える | — | ADR-0016 違反。重大。下記「public 化」へ |

公開ページの `<img>` は `event_media` 行の有無だけで出し分ける
(`public-event-page.tsx`)。行があってオブジェクトが無いと、ルートが 404 を返し、
ブラウザが壊れた画像を描く。これが一つ目の症状の仕組みである。

## 診断

1. **どちらが欠けているかを決める。**

   ```sql
   select media.object_key, media.content_type, media.is_main
   from public.event_media media
   join public.events event
     on event.published_revision_id = media.event_revision_id
   where event.id = '<event-id>';
   ```

   行が無ければ画像は未設定であり、復旧すべきものは無い。

2. **オブジェクトの有無を確かめる。** `events/{eventId}/` を prefix にして R2 を list
   する。1 の `object_key` が含まれるかを見る。

3. **範囲を確かめる。** 一件か、全件か。全件なら binding の設定を先に見る
   （`wrangler.jsonc` の `bucket_name` と、デプロイ先環境のバケット名）。個別の復旧に
   入らないこと。

## 復旧

### オブジェクトが失われた場合

**管理者が差し替える経路は無い。** 再アップロードは Revision 編集画面からしか行えず、
新しい object key を持つ新しい Revision を作る。つまり **再審査を伴う。**

1. 主催者に元画像の再アップロードを依頼する。
2. 主催者が Revision を作成し、画像を添付して提出する。
3. 管理者が `/admin/events` で承認する。承認と同時に公開ポインタが移る。

元画像が主催者の手元にも無い場合、復旧しない。次の手順で、壊れた表示だけを止める。

```sql
-- 公開中 Revision のメイン画像ポインタを外す。画像の領域そのものが出なくなる。
-- Revision の内容を変えるため、通常の編集経路が使えない状況でのみ用いる。
delete from public.event_media
where event_revision_id = (
  select published_revision_id from public.events where id = '<event-id>'
)
and is_main;
```

この削除は審査履歴に残らない。実施した場合は、対応記録を別途残し、主催者に通知する。

### 過去の Revision から object key を拾う

同じ画像が以前の Revision にも紐づいていることがある（下書き作成時に key を引き継ぐ
ため）。オブジェクトが生きていれば、ポインタだけを書き直せる。

```sql
select revision.id, revision.status, media.object_key, revision.created_at
from public.event_revisions revision
join public.event_media media on media.event_revision_id = revision.id
where revision.event_id = '<event-id>'
order by revision.created_at desc;
```

R2 に存在する key が見つかれば、公開中 Revision の `object_key` をその値に更新する。
`content_type` を実体と一致させること。ルートは `isAcceptedImageContentType` で
content type を検証しており、不一致は 404 になる。

### バケットが public になっていた場合

ADR-0016 の前提が崩れている。未承認 Revision の画像が到達可能な状態である。

1. public access を直ちに無効化する。
2. 公開停止の判断は、バケットが public であった期間と、その間に存在した未承認の
   オブジェクトの内容で決める。
3. object key は UUID を含むため総当たりは現実的でないが、漏洩した key は永続的に
   有効である。key の変更はオブジェクトの再作成（再アップロードと再審査）を要する。

## 取り下げたときの画像

`/events/{eventId}/image` は `Cache-Control: public, max-age=3600` を返す。immutable
ではないが、**取り下げ後も最大 1 時間、キャッシュから配信されうる。** 権利申し立てなど
で即時の停止が必要な場合、DB のポインタを外すだけでは足りない。Cloudflare 側の
キャッシュパージを併用する。*未検証* — パージ手順は実行して確かめていない。

## 未解決

- R2 に versioning もバックアップも設定していない。手動削除・誤上書きからの復旧手段が
  無い。本番稼働前に versioning の有効化を検討する。
- 管理者による画像の差し替え経路が無い。復旧が必ず主催者と再審査を経由する。
- `event_media` 行とオブジェクトの整合性を検査する仕組みが無い。不整合は公開ページの
  見た目で初めて気づく。
