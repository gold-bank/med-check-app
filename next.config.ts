import type { NextConfig } from "next";
// @ts-expect-error next-pwa does not have perfect typings
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true, // 즉시 대기열을 넘기고 새 버전 활성화
  // buildExcludes 옵션으로 인해 불필요한 메인 파일 캐싱 방지 가능
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
};

export default withPWA(nextConfig);
