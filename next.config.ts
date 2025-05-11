import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This will ignore build errors but allow type checking during development
    ignoreBuildErrors: true,
  },
  // devIndicators: false,
};

export default nextConfig;
