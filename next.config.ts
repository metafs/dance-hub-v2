import type { NextConfig } from "next";

/**
 * Sent with every response the application renders (docs/architecture/security.md).
 *
 * The Content-Security-Policy carries only directives that need no per-request
 * nonce: no page may be framed (the login and review screens included), and
 * forms, <base> and plugins stay on this origin. A script-src policy would need
 * a nonce on every inline script Next.js emits, which forces dynamic rendering;
 * it is left out rather than shipped with 'unsafe-inline'.
 *
 * HSTS covers this host only. Extending it to subdomains, or preloading, is a
 * commitment browsers keep for the whole max-age, so it waits until the
 * production domain's layout is settled.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // ADR-0016 caps a main image at 10MB; the rest is multipart overhead.
      // The Next.js default of 1MB would reject every real image.
      bodySizeLimit: "11mb",
    },
  },
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
