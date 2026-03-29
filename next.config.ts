import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  devIndicators: false,
  webpack: (config, { isServer }) => {
    // face-api.js needs canvas as optional dep
    config.externals = [...(config.externals || []), { canvas: 'canvas' }]
    // Prevent face-api.js / tfjs from pulling in Node-only modules on the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
      }
    }
    return config
  },
}

export default nextConfig
