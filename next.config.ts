import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 占位图为本地 SVG（public/images/product-*.svg）
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
