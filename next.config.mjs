/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Note: Custom headers don't work with static export
  // For GitHub Pages, we'll rely on the hosting platform's caching
};

export default nextConfig;
