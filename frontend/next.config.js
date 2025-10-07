/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig
