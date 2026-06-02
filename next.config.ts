import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/catalogo",
        destination: "/wines",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
