import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/speedstein',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
