/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@speedstein/shared', '@speedstein/database'],
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig
