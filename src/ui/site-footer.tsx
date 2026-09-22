import Link from "next/link";
import type { ReactNode } from "react";

import type { NavItem } from "./site-header";

export function SiteFooter({
  brand,
  description,
  items,
  navLabel,
}: {
  brand: ReactNode;
  description: string;
  items: readonly NavItem[];
  navLabel: string;
}) {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          {brand}
          <span>{description}</span>
        </div>
        <nav aria-label={navLabel}>
          {items.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
