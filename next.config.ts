import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
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
