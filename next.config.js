/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // No basePath needed for custom domain
  // basePath: process.env.NODE_ENV === 'production' ? '/WebSite' : '',
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/WebSite' : '',
}

module.exports = nextConfig