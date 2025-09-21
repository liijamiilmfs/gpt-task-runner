/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable streaming for audio responses
  async headers() {
    return [
      {
        source: '/api/speak',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
