import type { Metadata } from "next";

import { operatorInformation } from "@/features/legal/documents";
import { LegalDocumentPage } from "@/features/legal/components/legal-document-page";

export const metadata: Metadata = {
  title: operatorInformation.title,
  // A draft stays out of search results until its wording is settled (M7).
  ...(operatorInformation.draft ? { robots: { index: false, follow: true } } : {}),
};

export default function Page() {
  return <LegalDocumentPage document={operatorInformation} />;
}
