import Link from "next/link";

import { prefectureOptions } from "@/features/shared-entities/schema";
import { DefinitionRows, type DefinitionRow } from "@/ui/definition-rows";
import { PageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";

/**
 * The public statement of the listing policy (DH-33). The source of truth is
 * docs/product/listing-policy.md; this page states the clauses a Visitor,
 * Organizer, rights holder or performer relies on, with the same numbers, so a
 * rejection that cites "B-7" can be looked up here. Change both together.
 *
 * Operational rules that concern only the operator (the weekly review cap,
 * the exception log) and the criteria for curation stay unpublished, as the
 * policy itself requires.
 */

function clauses(items: readonly (readonly [string, string])[]): DefinitionRow[] {
  return items.map(([number, text]) => ({ key: number, term: number, detail: text }));
}

// The region follows the Prefecture enum the data model enforces, so this page
// cannot promise an area the service does not store (listing policy A-1).
const region = prefectureOptions.map((option) => option.label).join("・");

export default function PublicListingPolicyPage() {
  return (
    <div className="container container-narrow">
      <PageHead
        lede="p8ce が、どの Event を掲載し、どの主催者を承認し、どの場合に掲載を取り下げるかの基準です。不承認のときは、ここにある条文の番号をお知らせします。"
        meta={<span>掲載について</span>}
        title="掲載基準"
      />

      <Section id="policy-principles" size="small" title="基本の考え方">
        <DefinitionRows
          rows={clauses([
            ["1", "作品の質、ジャンルの正統性、団体の規模・知名度・活動年数を、掲載するかどうかの理由にしません。"],
            ["2", "迷ったときは掲載します。そのかわり、掲載の取り下げを軽い手続きで受け付けます。"],
            ["3", "裁量ではなく条件で判断します。条件はすべてこのページに書いています。"],
            ["4", "掲載できないときは、該当する条文の番号をお知らせします。「総合的に判断して」とは言いません。"],
          ])}
        />
        <p className="prose">
          掲載と、運営による紹介（特集など）は別のものです。掲載はこの基準だけで判断します。紹介は編集上の判断で行い、その基準は公開しません。掲載されていても、紹介に選ばれないことがあります。
        </p>
      </Section>

      <Section id="policy-scope" size="small" title="A. 対象">
        <DefinitionRows
          rows={clauses([
            ["A-1", `日程を持つ Event は、開催地が対象地域（${region}）にあること。`],
            ["A-2", "身体表現・舞台芸術に関する Event であること。"],
            ["A-3", "一般に公開されていること。誰でも申込・購入・入場できる状態をいいます。完全招待制、関係者限定、チケットが一般に販売されないものは対象外です。"],
            ["A-4", "日程を持つ Event は、開催日時が確定していること。日程のない募集（オーディション・公募・レジデンス）は、応募締切が確定していれば足ります。"],
            ["A-5", "日程を持つ Event は、会場が特定できること。オンライン配信のみの Event は対象外です。"],
          ])}
        />
        <p className="prose">
          ジャンルで除外しません。コンテンポラリー、バレエ、ストリート、舞踏、日本舞踊、民族舞踊、フィジカルシアター、パフォーマンスアート、ダンスを含む演劇は、すべて対象です。コンテスト・バトル、屋外のパフォーマンスも対象です。教室・スクールの発表会も、ほかの公演と同じように掲載します。定期的なレギュラーレッスンは対象外です。
        </p>
      </Section>

      <Section id="policy-form" size="small" title="B. 掲載に必要な情報">
        <DefinitionRows
          rows={clauses([
            ["B-1", "Event 名。"],
            ["B-2", "日程を持つ Event は、開催日時。複数回の公演はすべての回。日程のない募集は応募締切。"],
            ["B-3", "日程を持つ Event は、会場名と、特定できる所在地。"],
            ["B-4", "主催者名。"],
            ["B-5", "有効な問い合わせ先（公式サイト、SNS、メールアドレスのいずれか）。"],
            ["B-6", "料金を1件以上、チケット・申込先の URL を1件以上、または申込不要であることのいずれか。"],
            ["B-7", "日程を持つ Event は、最初の開催日の7日前まで（日本時間の暦日）に申請されていること。日程のない募集には適用しません。"],
          ])}
        />
        <p className="prose">
          出演者、振付、演出、メイン画像は必須ではありません。画像を登録する場合は、画像の内容を説明する代替テキストが必要です。
        </p>
      </Section>

      <Section id="policy-rights" size="small" title="C. 権利">
        <DefinitionRows
          rows={clauses([
            ["C-1", "主催者が申請する場合、申請者がその情報を掲載する権限を持つこと（主催者本人、または許諾を得た方）。"],
            ["C-2", "登録する画像について、利用の許諾を得ていること。"],
            ["C-3", "画像に写っている方の掲載の許諾を得ていること。"],
            ["C-4", "他の方の氏名を、本人の了承なく出演者として掲載していないこと。"],
          ])}
        />
      </Section>

      <Section id="policy-proxy" size="small" title="C. 権利（運営による代理掲載）">
        <p className="prose">
          主催者からの申請がない Event を、運営が代わりに掲載することがあります。その場合は次のすべてを守ります。
        </p>
        <DefinitionRows
          rows={clauses([
            ["C-5", "一般に公開されている告知だけをもとにします。"],
            ["C-6", "掲載後すみやかに主催者へお知らせし、修正・削除の窓口をお伝えします。"],
            ["C-7", "主催者からお申し出があれば、ただちに修正または削除します。"],
            ["C-8", "画像は転載しません。代理掲載の Event は画像なしで掲載します。"],
          ])}
        />
      </Section>

      <Section id="policy-exclusions" size="small" title="D. 掲載しないもの">
        <DefinitionRows
          rows={clauses([
            ["D-1", "法令に違反するもの。"],
            ["D-2", "特定の属性に対する差別・憎悪の扇動を目的とするもの。"],
            ["D-3", "実体のないオーディション・スカウトなど、参加者から不当に金銭を得る目的のもの。"],
            ["D-4", "宗教の勧誘、投資・連鎖販売の勧誘を主な目的とするもの。"],
            ["D-5", "性的サービスを主な目的とするもの。"],
            ["D-6", "虚偽の情報を含むもの。"],
          ])}
        />
        <p className="prose">
          この一覧に、品位・品質・「ふさわしくない」といった判断の言葉を加えることはありません。チケットノルマ、出演料の有無、参加費を集める形式の公演は、掲載するかどうかの基準にしていません。
        </p>
      </Section>

      <Section id="policy-organizers" size="small" title="E. 主催者の承認">
        <DefinitionRows
          rows={clauses([
            ["E-1", "団体または個人が実在し、責任者が特定できること。"],
            ["E-2", "有効な連絡先があること。"],
            ["E-3", "活動の実態を確認できる情報があること。公式サイト、SNS アカウント、過去の公演のいずれか一つで足ります。"],
            ["E-4", "過去にこの基準への重大な違反がないこと。"],
          ])}
        />
        <p className="prose">
          実績は求めません。初めて公演を行う個人・団体も承認の対象です。
        </p>
      </Section>

      <Section id="policy-withdrawal" size="small" title="F. 中止と掲載の取り下げ">
        <p className="prose">
          中止・延期になった Event は、中止として掲載を続けます。チケットを購入した方が中止を確認できるようにするためです。次の場合は掲載を取り下げ（削除し）、一覧・検索・URL のいずれからも見られない状態にします。
        </p>
        <DefinitionRows
          rows={clauses([
            ["F-1", "主催者から掲載の取り下げを求められたとき。理由は問いません。"],
            ["F-2", "権利者からの申し立てがあり、正当と判断したとき。"],
            ["F-3", "情報が虚偽であったと判明したとき。"],
            ["F-4", "安全またはプライバシー上の理由があるとき。"],
            ["F-5", "掲載後に、D のいずれかに当たると判明したとき。"],
          ])}
        />
        <p className="prose">
          中止の情報そのものを掲載しないでほしい場合は、F-1 の取り下げとしてお受けします。出演者ご本人から、ご自身の氏名や画像の削除を求められた場合は、Event 全体ではなく該当する箇所だけを削除します。
        </p>
        <p className="prose">
          <Link className="text-link" href="/listing-requests">掲載の削除・修正を依頼する</Link>
        </p>
      </Section>

      <Section id="policy-operations" size="small" title="G. 運営の約束">
        <DefinitionRows
          rows={clauses([
            ["G-1", "申請の審査結果は、原則として3営業日以内にお知らせします。超える場合は理由をお知らせします。"],
            ["G-3", "掲載できないときは、該当する条文の番号をお知らせします。"],
            ["G-5", "運営の関係者が出演・主催する Event も、同じ手続きで審査します。運営者本人以外が承認できない場合は、その Event のページに運営の関係者が関わっていることを明示します。"],
            ["G-6", "運営が代理で掲載した Event には、その旨と、主催者向けの修正の窓口を表示します。"],
          ])}
        />
      </Section>
    </div>
  );
}
