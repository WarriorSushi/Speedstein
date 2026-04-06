import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Speedstein',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
