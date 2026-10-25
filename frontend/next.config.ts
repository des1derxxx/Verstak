import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  images: { unoptimized: true },
  rewrites: async () => [
    { source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' },
  ],
};

export default nextConfig;
