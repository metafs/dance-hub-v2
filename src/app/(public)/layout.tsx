import Link from "next/link";

import { Logotype } from "@/ui/logotype";
import { SiteFooter } from "@/ui/site-footer";
import { SiteHeader, type NavItem } from "@/ui/site-header";

const navigation: readonly NavItem[] = [
  { href: "/events", label: "探す" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/open-calls", label: "募集中" },
];

const footerNavigation: readonly NavItem[] = [
  ...navigation,
  { href: "/workspace", label: "主催者の方へ" },
  { href: "/listing-requests", label: "掲載の削除・修正を依頼" },
];

/** The frame every page a Visitor can open without signing in shares. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader
        aside={<Link href="/workspace">主催者の方へ</Link>}
        home={<Logotype reading="ペイス" />}
        homeLabel="p8ce（ペイス）トップ"
        items={navigation}
        navLabel="メイン"
      />
      <main className="site-main">{children}</main>
      <SiteFooter
        brand={<Logotype reading="／ ペイス" />}
        description="東京都・神奈川県のダンスとパフォーマンスを探す"
        items={footerNavigation}
        navLabel="サイト"
      />
    </>
  );
}
