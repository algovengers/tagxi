import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https", // Only allow HTTPS images for security
        hostname: "**", // '**' is a wildcard that matches ANY domain
      },
    ],
    // TODO: FIX THIS LATER
    unoptimized: true, // Disables Next.js image optimization to allow any source
    // WARNING: This removes many performance benefits
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

export default config;
