import type { Metadata } from "next";

import { termsOfService } from "@/features/legal/documents";
import { LegalDocumentPage } from "@/features/legal/components/legal-document-page";

export const metadata: Metadata = {
  title: termsOfService.title,
  // A draft stays out of search results until its wording is settled (M7).
  ...(termsOfService.draft ? { robots: { index: false, follow: true } } : {}),
};

export default function Page() {
  return <LegalDocumentPage document={termsOfService} />;
}
