import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pzgmyajjpwucyaysjvid.supabase.co',
      },
    ],
  },
};

export default nextConfig;
