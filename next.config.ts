import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    serverActions: { bodySizeLimit: "16mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
