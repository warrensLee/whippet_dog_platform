import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*'
      },
    ];
  },
  allowedDevOrigins: ['127.0.0.1'],
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true }
};

export default nextConfig;
