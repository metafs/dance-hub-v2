import Link from "next/link";

import type { LegalDocument } from "@/features/legal/documents";
import { Notice } from "@/ui/notice";
import { PageHead } from "@/ui/page-head";
import { Section } from "@/ui/section";

/** A terms, privacy or operator page (docs/product/legal-requirements.md). */
export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <div className="container container-narrow">
      <PageHead lede={document.lede} meta={<span>p8ce について</span>} title={document.title} />
      {document.draft ? (
        <Notice tone="info">
          この文書は準備中です。内容は専門家の助言を受けて確定し、一般公開の前に掲載します。
        </Notice>
      ) : null}
      {document.sections.map((section) => (
        <Section id={section.id} key={section.id} size="small" title={section.title}>
          {section.decided ? (
            <>
              <p className="prose">{section.decided.text}</p>
              <p className="prose">
                <Link className="text-link" href={section.decided.href}>{section.decided.label}</Link>
              </p>
            </>
          ) : (
            <p className="prose muted">準備中です。</p>
          )}
        </Section>
      ))}
    </div>
  );
}
