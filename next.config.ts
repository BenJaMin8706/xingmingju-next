import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/supabase/:path*",
        destination: "https://ycefjltmcjkwavlihcsu.supabase.co/:path*",
      },
    ];
  },
};

export default nextConfig;
