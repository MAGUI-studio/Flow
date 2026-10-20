import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    // Cache compaction was blocking local requests for several minutes on Windows.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
