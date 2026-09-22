"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string };

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The public header: the home link, the primary navigation and one aside. */
export function SiteHeader({
  home,
  homeLabel,
  items,
  navLabel,
  aside,
}: {
  home: ReactNode;
  homeLabel: string;
  items: readonly NavItem[];
  navLabel: string;
  aside?: ReactNode;
}) {
  const pathname = usePathname() ?? "";

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link aria-label={homeLabel} className="site-header-home" href="/">
          {home}
        </Link>
        <nav aria-label={navLabel} className="site-nav">
          {items.map((item) => (
            <Link
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {aside ? <div className="site-header-aside">{aside}</div> : null}
      </div>
    </header>
  );
}
