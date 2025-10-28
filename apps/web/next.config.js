/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@speedstein/shared', '@speedstein/database'],
  typedRoutes: false,
}

module.exports = nextConfig
