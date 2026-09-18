import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { siteUrl } from "@/lib/env";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = "DANCE HUB";
const siteDescription = "ダンスEvent、Artist、Venue、Organizationの情報プラットフォーム";
const origin = siteUrl();

export const metadata: Metadata = {
  // metadataBase is omitted when NEXT_PUBLIC_SITE_URL is unset so that Open
  // Graph URLs stay relative rather than pointing at a guessed host.
  ...(origin ? { metadataBase: new URL(origin) } : {}),
  title: { default: siteName, template: `%s | ${siteName}` },
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
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
