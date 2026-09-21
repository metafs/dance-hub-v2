"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type TabItem = {
  href: string;
  label: string;
  count?: number;
  /** Only the exact path is current, for a tab whose path prefixes others. */
  exact?: boolean;
};

export function TabNav({ items, label }: { items: readonly TabItem[]; label: string }) {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label={label} className="tab-nav">
      {items.map((item) => {
        const current = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link aria-current={current ? "page" : undefined} href={item.href} key={item.href}>
            {item.label}
            {item.count ? <span className="tab-count">{item.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
