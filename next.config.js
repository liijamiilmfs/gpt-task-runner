/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sqlite3'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('sqlite3');
    }
    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
