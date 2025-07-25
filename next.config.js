/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/WebSite' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/WebSite' : '',
}

module.exports = nextConfig