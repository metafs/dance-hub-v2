# DANCE HUB — MVP Implementation Roadmap

**Status:** Active
**Last Updated:** 2026-09-01

## MVP outcome

DANCE HUB の MVP は、東京都・神奈川県のダンス Event を一般ユーザーが探索でき、承認済み Organization の Member が Event を下書き・審査提出し、Platform Admin の承認後に公開できる状態とする。公開後の変更と中止も審査対象とし、過去・中止 Event を削除しない。

## Current foundation

- Next.js、TypeScript、Supabase local、Cloudflare adapter、CI、`pnpm check`、`pnpm verify` が導入済み。
- Organization Application、Organization Membership、Platform Admin、東京・神奈川 Venue の初期 migration が導入済み。
- Artist / Venue Candidate の初期 migration が導入済み。
- Event Revision domain は PR #7 で進行中。

既存 migration は最初の構造を置いた段階であり、状態遷移関数、Owner invariant、公開用 policy、negative RLS test、seed の完成を UI 実装より先に行う。

## Milestones

### M1 — Domain integrity gate

**Goal:** 後続 UI が依存できる database contract を完成させる。

**Scope:**

- **M1.1 Schema:** PR #7 で Event、Event Revision、Schedule、Venue FK、revision status の migration を空 DB に適用可能にしてmergeする。続いて Artist credit、Ticket / 申込、Link、Media、Festival relation と監査記録を追加する。
- **M1.2 Trusted transitions:** Organization Application の approve / reject と初期 Owner 作成、最後の Owner を失わない制約、Candidate の activate / reject / merge、canonical change request、Revision の submit / request changes / approve / cancel を trusted database function と server use case で実装する。RLS は table への直接的な越権操作を拒否する。
- **M1.3 Verification:** Tokyo / Kanagawa、各 Role、各 workflow state、`apply`、Festival を含む deterministic seed と positive / negative RLS integration test を CI に追加する。

承認は即時公開とし、予約公開は MVP 外とする。編集審査中は直前の承認 Revision を表示し続ける。中止申請中も同様とし、中止承認後に公開ページへ中止理由を表示する。日時境界と過去判定は `Asia/Tokyo` を使う。

**Done when:** 空 DB と直前 migration 適用済み DB の両方で migration、seed、状態遷移、negative authorization test が CI で成功し、匿名ユーザーから非公開データを取得できない。

### M2 — Identity and Organization onboarding

**Goal:** Organizer と Platform Admin が安全に業務を開始できる。

**Scope:** login / logout、session、Organization Application form、Admin review queue、Organization selector、Owner / Admin / Editor の server-side authorization。

**Done when:** E2E で「申請 → 承認 → 初期 Owner で login → Organization workspace 表示」が通り、未承認・他 Organization・Role 不足操作が拒否される。

### M3 — Moderated Artist and Venue data

**Goal:** Organizer が Event 編集に必要な Artist / Venue を重複や越権なしで用意できる。

**Scope:** canonical search、Candidate form、作成 Organization の pending edit、Admin activation / rejection / merge、canonical change request。

**Done when:** E2E で Candidate が審査後に canonical record として選択可能になり、他 Organization には pending data が見えない。

### M4 — Event draft and review workflow

**Goal:** Organizer が公開要件を満たす Event Revision を作り、Platform Admin が審査できる。

**Scope:** Draft editor、Schedule / Venue、Artist credit、Ticket / 申込、外部 Link、main image 1 枚と alt text、Festival child、submit、changes requested、approve、公開後 Revision、cancellation review。

**Done when:** E2E で「Draft → 提出 → 差戻し → 再提出 → 承認 → 公開後変更」と「中止申請 → 承認 → 中止表示」が通る。公開ページは審査中も直前の承認 Revision を表示する。

### M5 — Public discovery

**Goal:** Visitor が MVP の主要経路から Event を発見できる。

**Scope:** Event 一覧・詳細、Artist / Venue 詳細、Calendar、日付・東京/神奈川・Event Type filter、テキスト検索、Open Call 締切順、Festival 親子、過去・Cancelled 表示。

**Done when:** 匿名 E2E が主要探索経路を通り、Schedule 0 件の `apply`、複数 Venue、Festival、過去・中止の境界 test が成功する。

### M6 — Release candidate

**Goal:** 公開運用できる品質と復旧手順を揃える。

**Scope:** metadata、Open Graph、sitemap、semantic HTML、keyboard / focus / form error、responsive QA、media validation、Cloudflare staging、migration / rollback runbook、監査 queue の運用確認。

**Done when:** staging で Organizer・Admin・Visitor の critical E2E が完走し、`pnpm verify`、accessibility check、公開情報漏洩 test、rollback rehearsal が成功する。

## Parallel execution

```text
M1
 ├─ M2 Identity / Organization
 └─ M3 Artist / Venue moderation
        \
         M4 Event draft / review
              ├─ M5 Public discovery
              └─ M6 release preparation
```

M2 と M3 は M1 完了後に並列実装できる。M5 の read-only query と画面骨格は M4 の schema contract 確定後に先行できるが、公開判定 E2E は M4 完了を待つ。M6 の CI・accessibility・運用文書は各マイルストーンと並行して積み上げ、最後に release gate として閉じる。

各マイルストーンで `pnpm check` と Cloudflare production build を維持する。M2 以降の E2E は local Supabase を基準にし、M6 で同じ critical journey を staging に対して実行する。Organization Role の操作範囲は `docs/architecture/auth.md`、公開必須項目と日付規則は `docs/product/requirements.md` を正本とする。

## MVP release gates

- Product: Organization onboarding、Candidate moderation、Event review、公開 discovery が end-to-end で利用できる。
- Data: migration と seed だけで環境を再構築でき、承認履歴と公開 Revision を失わない。
- Security: 全 mutation を server authorization と RLS で保護し、draft・candidate・application・未承認 media を公開しない。
- Quality: `pnpm verify`、critical E2E、authorization negative cases、基本 accessibility が CI で成功する。
- Operations: Platform Admin の審査手順、staging確認、migration rollback、既知の制約が文書化されている。

## Deferred until after MVP

地図 UI、複数画像、Artist Claim、他 Organization の Festival child、多言語、通知、Favorites、推薦、決済、CSV import、外部サイトの自動取得は MVP release gate に含めない。
