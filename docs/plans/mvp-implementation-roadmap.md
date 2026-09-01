# DANCE HUB — MVP Implementation Roadmap

**Status:** Draft
**Last Updated:** 2026-09-01

## Goal

現在の要件・アーキテクチャ文書を、実装可能な依存順のマイルストーンへ分解し、
Initial MVP の Visitor Flow と Organizer Flow を安全に完成させる。

本計画は日付を約束するスケジュールではない。各フェーズは、前提となる判断と
検証が完了した後に開始する。新しいプロダクト要件は追加せず、MVP外の機能は
対象に含めない。

## Current State

- Milestone 0 のAI開発用ドキュメント、計画テンプレート、Issue / PRテンプレートは存在する。
- アプリケーションのscaffold、`package.json`、標準検証コマンド、Migration、Seed、CIはまだ存在しない。
- Runtime / database / hostingに関するADR-0001〜0003と、Domain / authorizationに関する
  ADR-0004〜0009はすべて `Proposed` であり、未承認である。
- Organization roleの正確な権限表とAdministratorによるEvent takedown要件が未確定である。

したがって、実装開始前に「決定済みとしてコードへ固定してよい事項」と「未決事項」を
分離する必要がある。

## Planning Principles

1. **縦に完成させる。** DBだけ、UIだけを横断的に作り切るのではなく、公開Eventの
   読み取り、OrganizerのDraft作成など、検証可能なユーザーフロー単位で進める。
2. **認可を後付けしない。** Organizer向けMutationは、Role定義、Server-side check、
   Database policy、Integration testを同じフェーズで実装する。
3. **MigrationとSeedを先行させる。** SchemaはMigrationから再構築できる状態を保ち、
   生成DB型を手編集しない。
4. **検索専用基盤を導入しない。** MVP検索はPostgreSQL / Applicationの範囲で実装し、
   専用検索サービスや推薦機能は追加しない。
5. **各フェーズを標準コマンドで閉じる。** Scaffold導入後はすべてのフェーズで
   `pnpm check`、リリース候補では`pnpm verify`を成功させる。

## Requirement Coverage

| Workstream | Requirement IDs |
| --- | --- |
| Application foundation | NFR-DATA-002, NFR-DATA-003, NFR-TYPE-001, NFR-TEST-001, NFR-AI-002 |
| Domain and authorization foundation | REQ-ARTIST-001〜002, REQ-ARTIST-005〜007, REQ-VENUE-001, REQ-VENUE-003〜005, REQ-ORG-001〜005, REQ-AUTH-001〜003, NFR-SEC-001〜002, NFR-DATA-001 |
| Public event vertical slice | REQ-EVENT-001〜009, REQ-ARTIST-003〜004, REQ-VENUE-002, REQ-EVENT-006, REQ-EVENT-007 |
| Organizer publishing | REQ-PUBLISH-001〜004, REQ-MEDIA-001〜003 |
| Discovery | REQ-DISCOVERY-001〜006 |
| Public quality and release | NFR-SEO-001〜002, NFR-ACC-001, NFR-RESP-001, NFR-TEST-001 |

## Phase 0 — Decision and Delivery Readiness

### Objective

未承認または未定義の事項をコードへ固定する前に、人間がレビューできる決定単位へ整理する。

### Work

1. ADR-0001〜0009を個別にレビューし、`Accepted`、修正継続、または`Rejected`を決定する。
2. Next.js / Cloudflare adapter / Supabaseの最小compatibility spikeを行い、ADR-0001〜0003の
   前提を検証する。Spikeのコードを本実装へ残す場合は、通常の品質基準を適用する。
3. Owner / Admin / Editorの操作別権限表を定義し、`docs/architecture/auth.md`へ反映する。
4. Administrator takedownをMVP要件にするか判断する。採用時はRequirement ID、状態遷移、
   監査要否を明文化してから実装計画へ追加する。
5. MilestoneとRequirement IDを対応させたIssueを作成し、各Issueへ具体的なAcceptance
   Criteriaを記載する。

### Exit Criteria

- 実装に使用するADRが`Accepted`になっている。
- Roleごとの作成・編集・公開・承認権限に未定義部分がない。
- Administrator takedownの扱いがRequirementまたは明示的なMVP外として記録されている。
- Scaffoldと最初の縦スライスのIssueが、人間による実装開始承認を得ている。

## Phase 1 — Reproducible Application Foundation

### Objective

機能実装を安全に積み上げられる、最小のNext.js / TypeScript / Supabase開発基盤を作る。

### Work

1. Accepted ADRに従ってNext.js applicationとpnpm workspaceをscaffoldする。
2. Lint、format check、typecheck、unit test、build、critical E2Eのrunnerを設定する。
3. `pnpm check`をlint + typecheck + unit tests、`pnpm verify`をcheck + build + critical
   E2Eとして実装する。
4. Supabase local development、Migration、Seed、DB型生成の手順を追加する。
5. GitHub Actionsで`pnpm check`を必須化し、環境が整い次第`pnpm verify`も実行する。
6. Environment variableのexampleと運用説明を追加する。実値やproduction credentialは
   コミットしない。

### Exit Criteria

- 新規checkoutから文書化された手順で依存関係とlocal DBを再現できる。
- 空のapplicationでも`pnpm check`と`pnpm verify`が成功する。
- CIが同じ検証コマンドを使用する。
- MigrationからDBを再構築し、Seedを投入し、DB型を再生成できる。

## Phase 2 — Domain, Authentication, and Authorization Foundation

### Objective

後続の全フローが依存するEntity、Relation、Authentication、Organization-scoped
AuthorizationをMigrationとIntegration testで確立する。

### Work

1. User profile、Organization、OrganizationMembership、Artist、Venue、Event、
   EventSchedule、EventArtist / Credit、TicketType、EventMediaをMigrationで定義する。
2. Event Type、Event Status、Organization Status、Artist Type、prefecture、
   `application_deadline`、`parent_event_id`と必要なFK / unique / check constraintを定義する。
3. Organization–Artist optional 1:1 approval linkと、Venue / Artistの
   `owner_organization_id`を実装する。
4. Event Type Groupとprefecture→region group mappingをapplicationの単一モジュールに置き、
   DB enumとして重複させない。
5. Public readとOrganizer writeを分離し、確定済み権限表に従うServer-side authorizationと
   RLS policyを実装する。
6. `pending` OrganizationはDraftを作成できるが公開できないこと、非ownerはVenue / Artistを
   編集できないこと、Administrator例外をIntegration testで固定する。
7. Festivalの1段制約、同一Organization制約、応募型Eventのdeadline制約をDBと
   Applicationの適切な層で強制する。

### Exit Criteria

- Local DBをMigration + Seedのみで再構築できる。
- 主要RelationがID / FKで保護され、名称文字列をrelation keyに使用していない。
- 未認証、他Organization、Role不足、pending Organizationによる禁止操作が失敗する。
- 生成されたDB型をApplicationが使用し、型生成の再現手順が検証されている。

## Phase 3 — Public Event Discovery Vertical Slice

### Objective

Visitorが公開Eventを一覧から詳細まで辿れる、最初のend-to-end価値を完成させる。

### Work

1. Published Eventのみを返すserver-side queryとEvent一覧を実装する。
2. Event詳細にタイトル、説明、種別、複数Schedule、Venue、Artist / Credit、Organization、
   Ticket / 外部URL、main imageを表示する。
3. Artist詳細とVenue詳細を実装し、それぞれPublished Eventのみを関連表示する。
4. 過去Eventを削除せず、Event Type Groupごとの過去判定を共通のDomain logicに実装する。
5. Festivalを一覧では会期付きの1件として扱い、詳細で子Eventを表示する。日付を持たない
   空Festivalは、Phase 0で決めた表示仕様に従う。
6. Public routeをserver renderingし、未公開データがmetadataやresponseへ漏れないことを
   Integration / E2E testで確認する。

### Exit Criteria

- E2Eで「Event一覧 → Event詳細」「Artist詳細 → 関連Event」「Venue詳細 → 関連Event」が通る。
- Draft Eventとpending / rejected Organizationの非公開情報を匿名Visitorが取得できない。
- 通常Event、応募型Event、Festivalの境界条件がunit / integration testで固定されている。

## Phase 4 — Organizer Draft and Publishing Vertical Slice

### Objective

Organizerがloginし、所属OrganizationでEventをDraft作成・編集・公開・公開後編集できるようにする。

### Work

1. Login、logout、session handling、Organization選択を実装する。
2. Event基本情報、Event Type、複数Schedule、application deadline、Venue、Artist / Credit、
   Ticket、外部URL、Festival親子関係を編集できるDraft flowを実装する。
3. Organization-scopedなArtist / Venueの新規作成と、既存Entityの参照選択を実装する。
4. Event Type Groupに応じたvalidationを共有schemaに集約し、client表示だけでなくserverで強制する。
5. approved Organizationのみ即時公開できるようにし、Event単位の承認状態は追加しない。
6. cancellationと公開後編集を実装し、statusとPast Eventを混同しない。
7. main image upload、alt text、credit、display orderを保持できるMedia relationを実装する。
   MVP UIはmain image 1件に限定しても、schemaは複数Mediaを保持できる形にする。

### Exit Criteria

- Critical E2E「login → Draft作成 → 必須情報入力 → 公開 → 公開後編集」が成功する。
- pending Organization、他OrganizationのUser、Role不足Userによる公開・更新がserver / DBで拒否される。
- 画像のtype / size等の検証と、object accessの認可がIntegration testで確認されている。

## Phase 5 — Calendar, Filters, Search, and Open Calls

### Objective

MVPで定義された探索経路を公開Eventデータへ追加する。

### Work

1. Scheduleだけを対象とするCalendarと単日 / 期間filterを実装する。
2. prefecture mappingを用いた関東 / 関西filterを実装する。
3. Event Type filterを実装し、Festival / child Eventの表示規則を統一する。
4. Event名、Artist名、Venue名、Organization名を対象とする基本text searchを実装する。
5. `apply` groupのみをapplication deadline順で表示するOpen Call一覧を実装する。
6. Filter parameterをURLへ保持し、server-side query、pagination、空状態、境界日時をtestする。

### Exit Criteria

- REQ-DISCOVERY-001〜006の各経路にintegration testがある。
- application deadlineがCalendarへ混入せず、Festival自身が日付filterへ重複表示されない。
- SearchはDraftや非公開Organizationのデータを返さない。

## Phase 6 — Approval Surfaces, SEO, Accessibility, and Release Hardening

### Objective

管理上必須の承認フローと、公開サービスとして必要な品質を揃えてMVP release candidateを作る。

### Work

1. Administrator向けOrganization approval queueとOrganization–Artist link approval queueを
   最小UIで実装する。
2. Event / Artist / Venueのtitle、description、Open Graph metadataとsitemap生成を実装する。
3. Semantic HTML、keyboard操作、focus state、form error、image altを自動・手動で確認する。
4. Mobile Firstで主要画面をスマートフォン、タブレット、デスクトップの代表viewportで確認する。
5. Critical E2E、authorization negative cases、Migration reset、buildをCIへ統合する。
6. Production-like stagingでCloudflare / Supabase / media連携を確認し、rollback手順と既知の制約を記録する。

### Exit Criteria

- Initial MVPのVisitor FlowとOrganizer Flowがstagingで完走する。
- `pnpm verify`がlocalとCIで成功する。
- 公開routeのmetadata、sitemap、基本accessibility、responsive表示が検証されている。
- 未解決事項、運用手順、rollback方針がrelease noteまたは運用文書に記録されている。

## Data / Migration Plan

- Schema変更は機能Issueごとの前進Migrationとして追加する。
- Seedは最低限、各Organization status、各Role、通常 / 応募型 / Festival Event、過去 / 未来、
  関東 / 関西、owner / non-ownerの認可fixtureを含める。
- Migration CIは空DBへの適用とSeed投入を検証する。既存Migrationや生成型を手編集しない。
- Application-level validationに置く制約（Event Type Group mapping等）も、DB-backed
  Integration testで不整合を作れないことを確認する。

## Security / Authorization

- Browserへservice-role credentialを渡さず、privileged Administrator操作はserver側へ限定する。
- UIの非表示は利便性のためだけに使い、すべてのMutationをserver-side checkとRLSで保護する。
- Public queryはPublishedかつ公開可能なOrganizationに限定し、relation経由のDraft漏洩もtestする。
- Uploadはextensionだけを信用せず、許可type、size、object key、ownership、配信範囲を検証する。
- Role matrixが確定するまでOrganization-scoped Mutationを実装しない。

## Test Strategy

| Layer | Primary responsibility |
| --- | --- |
| Unit | Event Type Group、region mapping、過去判定、validation、Festival表示期間 |
| Integration | Migration、query、RLS、Role / Organization境界、公開可視性、search / filter |
| E2E | 3つのVisitor journeyとOrganizerのlogin→Draft→publish journey |
| Build / deploy | Server rendering、metadata、runtime compatibility、environment contract |
| Manual | Accessibilityの補完確認、responsive表示、staging upload / delivery |

各Issueは該当するfocused testを先に実行し、その後`pnpm check`を実行する。Milestone完了時と
release candidateでは`pnpm verify`を実行する。コマンドが導入される前は成功扱いにせず、
Phase 1のblockerとして報告する。

## Documentation Updates by Phase

- Phase 0: ADR status、`docs/architecture/auth.md`、必要ならProduct Requirements / Scope。
- Phase 1: README、local setup、testing、deployment、environment contract。
- Phase 2: data model、auth / security、Migration / Seed / generated type手順。
- Phase 3〜5: 実装上確定した利用者向け挙動。ただし要件変更は先にRequirementsを更新する。
- Phase 6: deployment / operations、release checklist、既知の制約。

Architectureを変更する場合は対応ADRを更新または追加し、実装と同じ変更へ含める。

## Risks and Open Questions

### Blocking before related implementation

1. **ADR status:** ADR-0001〜0009が未承認のため、該当技術・schema・認可を確定実装できない。
2. **Role permissions:** Owner / Admin / Editorの正確な権限が未定義であり、RLS policyと
   negative testの期待値を確定できない。
3. **Administrator takedown:** 即時公開後の品質担保がこの機能を前提としている一方、
   対応Requirementが存在しない。Phase 0でMVP内外を決める。
4. **Empty Festival display:** 子EventがないFestivalの一覧表示が未定義である。
   Public Event vertical slice前に表示 / 公開条件を決める。

### Validate early, but not necessarily blocking all work

5. **Cloudflare compatibility:** Next.js runtime、Supabase Auth、image upload、E2E環境の組合せを
   Phase 0 spikeで検証する。
6. **Application-only conditional constraints:** apply deadlineやFestival制約が複数write pathで
   逸脱しないよう、共通serviceとDB-backed testが必要である。
7. **Search quality:** MVPは基本text searchに限定し、ranking改善や専用infraを先取りしない。

Artist membershipと他Organization所有のFestival child Eventは明示的にPost-MVPであり、
この計画ではschemaの先回り実装を行わない。

## Recommended Issue Sequence

1. ADR review and unresolved requirement decisions
2. Application scaffold and deterministic validation
3. Local Supabase, Migration, Seed, and generated types
4. Role matrix, Authentication, RLS, and authorization test harness
5. Core domain schema and constraints
6. Public Event list/detail vertical slice
7. Artist/Venue detail and related Event traversal
8. Organizer login and Draft editor
9. Publish/edit/cancel authorization flow
10. Media upload and delivery
11. Calendar/date/region/type filters
12. Search and Open Call listing
13. Administrator approval queues
14. SEO/accessibility/responsive hardening
15. Critical E2E, staging verification, and MVP release review

各項目は原則として`1 Issue = 1 Branch = 1 Worktree = 1 Primary Agent`で実施し、
複数の独立したAcceptance Criteriaを持つ場合はさらに小さく分割する。

## Completion Criteria

- Product RequirementsのInitial MVP Success Criteriaをstagingで再現できる。
- Requirement Coverage表の全IDが、実装Issueと自動テストへ追跡可能である。
- Migration + Seedからlocal DBを再構築できる。
- AuthorizationがUI以外の層で強制され、主要なdeny caseが自動テストされている。
- `pnpm check`と`pnpm verify`がlocal / CIで成功する。
- Accepted ADR、Architecture文書、運用文書が実装と一致し、未解決リスクが明示されている。
