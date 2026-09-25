import type { Metadata } from "next";
import localFont from "next/font/local";

import { siteUrl } from "@/lib/env";
import { SkipLink } from "@/ui/skip-link";

import "./globals.css";

// Instrument Sans is the logotype's face (docs/brand/identity.md) and the
// interface's Latin face. It is served from the repository so a build needs no
// network access; Japanese falls through to the system stack (ADR-0022).
const instrumentSans = localFont({
  variable: "--font-instrument-sans",
  display: "swap",
  src: [
    { path: "./fonts/instrument-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/instrument-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});

const siteName = "p8ce";
// The one-line description travels with the name wherever p8ce stands alone
// (docs/brand/identity.md, 一行説明とタグライン).
const siteDescription = "東京都・神奈川県のダンスとパフォーマンスを探す";
const origin = siteUrl();

export const metadata: Metadata = {
  // metadataBase is omitted when NEXT_PUBLIC_SITE_URL is unset so that Open
  // Graph URLs stay relative rather than pointing at a guessed host.
  ...(origin ? { metadataBase: new URL(origin) } : {}),
  title: { default: `${siteName}（ペイス）| ${siteDescription}`, template: `%s | ${siteName}` },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName,
    title: siteName,
    description: siteDescription,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={instrumentSans.variable}>
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
