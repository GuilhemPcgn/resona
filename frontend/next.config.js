/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  experimental: {
    outputFileTracingRoot: undefined,
  },
  webpack: (config) => {
    // @react-pdf/renderer uses canvas for font metrics; prevent webpack from
    // trying to resolve the native canvas module (not needed in the browser).
    config.resolve.alias.canvas = false;
    return config;
  },
}

module.exports = nextConfig
