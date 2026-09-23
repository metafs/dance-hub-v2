import type { Metadata } from "next";

import { NotFoundContent } from "../not-found-content";

export const metadata: Metadata = { title: "ページが見つかりません" };

/**
 * A public page that does not exist or is not public, such as an Event that
 * was never published or has been withdrawn (ADR-0018). The public layout
 * already provides the header, main and footer.
 */
export default function PublicNotFound() {
  return <NotFoundContent />;
}
