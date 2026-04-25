import type { NextConfig } from "next";

const betaOrigin = process.env.PILLAR_MVP_ORIGIN;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!betaOrigin) {
      return [];
    }

    return [
      {
        source: "/beta",
        destination: `${betaOrigin}/`,
      },
      {
        source: "/beta/:path*",
        destination: `${betaOrigin}/:path*`,
      },
      {
        source: "/assets/:path*",
        destination: `${betaOrigin}/assets/:path*`,
      },
      {
        source: "/api/tts",
        destination: `${betaOrigin}/api/tts`,
      },
    ];
  },
};

export default nextConfig;
