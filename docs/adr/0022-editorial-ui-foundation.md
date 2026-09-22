# ADR-0022: 無彩色の UI 基盤と Instrument Sans の同梱

**Status:** Accepted
**Accepted:** 2026-09-21
**Amends:** ADR-0012（書体の項）

## Context

UI のトーンは 2026-09-19 に無彩色・editorial の方向に決まった（DEC-UI-001）。一方、`src/app/globals.css` にはライムの `--acid`、緑がかった地、グラデーション、影など、撤回した方向の名残が残っていた。未定義の `--accent` を参照して未読通知の印が表示されない不具合もあった。

書体は ADR-0012 で Geist と端末の日本語フォントと決めていたが、ロゴタイプは Instrument Sans であり（identity.md）、画面とロゴの欧文が一致していなかった。また Geist は `next/font/google` からビルド時に取得しており、外部に接続できない環境ではビルドできなかった。

画面ごとにヘッダーや見出しを個別に組んでいたため、運営の4画面がそれぞれヘッダーとログアウトを持つなど、部品の重複が多かった。

## Decision

- トークンを `#141414` と `#ffffff` の間のグレーだけで構成し直す。状態は色ではなく形（枠線・塗り・破線・●○）で示す。詳細は `docs/design/ui.md`。
- 画面の欧文を Instrument Sans（400・500・600、latin）とし、woff2 を `src/app/fonts/` に同梱して `next/font/local` で配信する。ライセンスは SIL OFL 1.1（`src/app/fonts/InstrumentSans-OFL.txt`）。Geist は使わない。
- 和文は引き続き端末の日本語フォントに任せる（ADR-0012 の判断を維持）。
- 見た目の部品は `src/ui/` に置き、ページはそれを組み合わせる。公開面は `src/app/(public)/layout.tsx`、主催者は `src/app/workspace/layout.tsx` と `[organizationId]/layout.tsx`、運営は `src/app/admin/layout.tsx` で枠を共有する。
- スタイルの正本は引き続き `src/app/globals.css` の1ファイルとする（ADR-0012）。

## Alternatives considered

- **Geist を残し、ロゴだけ Instrument Sans にする:** 画面の数字とロゴの数字の字形が揃わない。ビルド時の外部取得も残る。
- **`next/font/google` で Instrument Sans を取得する:** 依存は増えないが、ビルドが Google Fonts への接続に依存し続ける。
- **`@fontsource/instrument-sans` を依存に加える:** 取得元は npm になるが、使う3ファイルのために依存が増える。
- **和文 Web フォント（Noto Sans JP）を配信する:** 端末差はなくなるが、配信量が大きい。ADR-0012 の保留理由は変わっていない。
- **CSS Modules や Tailwind に移る:** ADR-0012 の Revisit when には該当しない。部品は `src/ui/` に分けたが、スタイルは1ファイルで足りている。

## Consequences

- ビルドは外部のフォント配信に依存しない。
- 欧文と数字の字形がロゴタイプと一致する。
- 状態の色分けがなくなるため、状態を示すときは必ず言葉（ラベル）を添える。
- `src/ui/` の部品はドメインを知らないため、Event を行に変換するなどの処理は各 feature に置く（`features/discovery/components/event-row.tsx` など）。
- フォントを更新するときは、同梱ファイルとライセンスを同じ変更で差し替える。

## Revisit when

- アクセント色を1色採ると決めたとき（identity.md の候補）。
- 和文 Web フォントを採ると決めたとき。
- ダークモードを実装するとき。
