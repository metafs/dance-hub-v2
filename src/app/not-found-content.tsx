import Link from "next/link";

import { PageHead } from "@/ui/page-head";

/** What a missing page says, in the public frame or on its own. */
export function NotFoundContent() {
  return (
    <div className="container container-narrow">
      <PageHead lede="URL が正しいか確認してください。" title="ページが見つかりません" />
      <p className="prose">
        <Link className="text-link" href="/">トップへ</Link>
        {"　"}
        <Link className="text-link" href="/events">Event を探す</Link>
      </p>
    </div>
  );
}
