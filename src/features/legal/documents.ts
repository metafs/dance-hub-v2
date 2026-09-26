/**
 * The terms, the privacy policy and the operator page (roadmap M7, DH-30〜32).
 *
 * What each must say is listed in docs/product/legal-requirements.md; the
 * wording is settled with legal advice, and is not drafted here. Until then a
 * document is a draft: its page shows the sections it will have, says it is in
 * preparation, and asks search engines not to index it. A section whose
 * content is already decided elsewhere links to where it is decided.
 */

export type LegalSection = {
  id: string;
  title: string;
  /** Where the decided content already lives, when it does. */
  decided?: { text: string; href: string; label: string };
};

export type LegalDocument = {
  path: string;
  title: string;
  lede: string;
  draft: boolean;
  sections: readonly LegalSection[];
};

export const termsOfService: LegalDocument = {
  path: "/terms",
  title: "利用規約",
  lede: "p8ce を使うときの約束です。",
  draft: true,
  sections: [
    { id: "terms-accounts", title: "主催者のアカウント" },
    {
      id: "terms-review",
      title: "掲載の審査",
      decided: { text: "審査の基準は掲載基準に定めています。", href: "/listing-policy", label: "掲載基準" },
    },
    { id: "terms-prohibited", title: "掲載できないもの" },
    { id: "terms-rights", title: "画像と氏名の権利" },
    { id: "terms-proxy", title: "運営による代理掲載" },
    { id: "terms-cancellation", title: "中止と掲載の削除" },
    { id: "terms-tickets", title: "チケットと申込" },
    { id: "terms-disclaimer", title: "免責" },
    { id: "terms-changes", title: "規約の変更" },
    { id: "terms-law", title: "準拠法と管轄" },
  ],
};

export const privacyPolicy: LegalDocument = {
  path: "/privacy",
  title: "プライバシーポリシー",
  lede: "p8ce が取得する情報と、その扱いです。",
  draft: true,
  sections: [
    { id: "privacy-collected", title: "取得する情報" },
    { id: "privacy-public", title: "公開する情報" },
    { id: "privacy-processors", title: "情報を扱う委託先" },
    { id: "privacy-retention", title: "保存する期間" },
    { id: "privacy-requests", title: "開示・訂正・削除のご請求" },
    { id: "privacy-changes", title: "このポリシーの改定" },
  ],
};

export const operatorInformation: LegalDocument = {
  path: "/operator",
  title: "運営者情報",
  lede: "p8ce を運営している者と、連絡先です。",
  draft: true,
  sections: [
    { id: "operator-name", title: "運営者" },
    {
      id: "operator-involvement",
      title: "運営者が関わる Event",
      decided: { text: "運営の関係者が出演・主催する Event の扱いは、掲載基準 G-5 に定めています。", href: "/listing-policy#policy-operations", label: "掲載基準 G. 運営の約束" },
    },
    {
      id: "operator-contact",
      title: "お問い合わせ",
      decided: { text: "掲載の削除・修正は、依頼フォームで受け付けます。", href: "/listing-requests", label: "掲載の削除・修正を依頼する" },
    },
  ],
};

export const legalDocuments = [termsOfService, privacyPolicy, operatorInformation] as const;
