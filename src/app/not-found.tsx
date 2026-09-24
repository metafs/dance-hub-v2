import type { Metadata } from "next";

import PublicLayout from "./(public)/layout";
import { NotFoundContent } from "./not-found-content";

export const metadata: Metadata = { title: "ページが見つかりません" };

/**
 * A URL that matches no route. It is shown in the public frame, in Japanese
 * like the rest of the site, instead of the framework's English default.
 */
export default function NotFound() {
  return (
    <PublicLayout>
      <NotFoundContent />
    </PublicLayout>
  );
}
