import Link from "next/link";
import type { ReactNode } from "react";

import { Logotype } from "@/ui/logotype";
import { mainContentId } from "@/ui/skip-link";

/** The frame of the sign-in and account pages: the logotype and one panel. */
export function AuthFrame({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link aria-label="p8ce（ペイス）トップ" className="site-header-home" href="/">
            <Logotype reading="ペイス" />
          </Link>
        </div>
      </header>
      <main id={mainContentId} className="container auth-main">
        <section aria-labelledby={labelledBy} className="auth-panel">
          {children}
        </section>
      </main>
    </>
  );
}
