# ADR-0024: 恒久 URL に UUID を使う

**Status:** Accepted
**Accepted:** 2026-09-24

## Context

公開ページの URL は、検索エンジンに登録され、SNS やチラシで共有された後は変えにくい。変えると、古い URL からの転送を持ち続けることになる。ロードマップ v0.4 は、公開前にこの形式を決めることを DEC-R2 としていた。

現在の公開 URL は `/events/{id}`、`/artists/{id}`、`/venues/{id}` で、`{id}` は各行の UUID である。sitemap と Event の構造化データ（DH-26）も同じ形式で URL を出している。

前提として、Event 名は日本語であり、公開後も Revision で変わりうる（ADR-0007）。

## Decision

- Event・Artist・Venue の恒久 URL は、現在の `/events/{id}`・`/artists/{id}`・`/venues/{id}`（UUID）とする。slug も短い ID も MVP では設けない。
- 公開後、この形式の URL を変更・廃止しない。取り下げた Event は 404 を返す（ADR-0018）が、URL そのものは再利用しない。

## Alternatives considered

- **slug のみ（`/events/morishita-shinsaku-2026`）:** URL から内容が分かる。しかし日本語の Event 名は、そのままだとコピー時に `%E6%96%B0…` の形になり、ローマ字化は読みにくく、主催者に入力させると入力項目と審査項目が増える。Event 名が変わるたびに slug が変わり、転送を持ち続ける必要がある。同名 Event の重複規則も要る。
- **ID + slug（`/events/{id}/{slug}`）:** ID を正とするので名前の変更に強いが、URL はかえって長くなり、日本語 slug の問題は残る。転送処理の実装が要る。
- **短い ID（`/e/k3x9p2`）:** 印刷物・QR コード・口頭に向く。列と一意制約と route の追加が要る。

URL にキーワードを含めることの検索順位への効果は小さい。発見性はページのタイトル・説明・構造化データ・sitemap が担う。

## Consequences

- 追加の実装は要らない。Event 名を変えても URL は壊れない。
- ID は推測できないため、連番のように全件を辿られない。
- 掲載の削除・修正依頼フォームは、引き続き「URL の末尾の英数字」を Event ID として受け付けられる。
- URL は 36 文字の UUID を含み、印刷物・QR コード・口頭での伝達には向かない。
- 短い URL が必要になった場合は、既存の URL を置き換えず、恒久 URL へ転送する別名として追加できる。本決定はその追加を妨げない。

## Revisit when

- チラシや QR コードで Event を案内する運用が始まり、URL の長さが実際に問題になったとき（別名の追加を検討する。恒久 URL は変えない）。
