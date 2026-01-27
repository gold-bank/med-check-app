import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Turbopack 설정
  turbopack: {},
  // 캐시 비활성화를 위한 헤더 설정
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
