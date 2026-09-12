import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/changelog",
        destination: "/release-note",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
