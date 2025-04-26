/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placekitten.com'],
  },
  env: {
    NEXTAUTH_URL: 'http://localhost:3000'
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 