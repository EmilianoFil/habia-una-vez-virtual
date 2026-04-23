/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  // Support for dynamic tenant branding
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
}

// Only wrap with PWA in production builds
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    workboxOptions: {
      disableDevLogs: true,
    },
  })
  module.exports = withPWA(nextConfig)
} else {
  module.exports = nextConfig
}
