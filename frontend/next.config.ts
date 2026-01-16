import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In Next.js 15.3+ and 16, use 'turbopack' instead of 'turbo'
  turbopack: {
    resolveAlias: {
      "@/*": "./src/*",
    },
  },
};

export default nextConfig;
