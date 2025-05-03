/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'production' 
      ? 'https://movaga.onrender.com' 
      : 'http://localhost:3000',
    NEXT_PUBLIC_URL: process.env.NODE_ENV === 'production' 
      ? 'https://movaga.onrender.com' 
      : 'http://localhost:3000',
    BARION_POS_KEY: 'fab5fa17-77a6-4cf6-a5ae-a5cb81e264d8',
    NEXT_PUBLIC_BARION_POS_KEY: 'fab5fa17-77a6-4cf6-a5ae-a5cb81e264d8'
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Blokkolja a bcrypt-et és egyéb szerveroldali modulokat, 
      // hogy ne próbálja meg beolvasni őket webpack
      config.plugins.push(
        new config.webpack.NormalModuleReplacementPlugin(
          /bcrypt|@mapbox\/node-pre-gyp|aws-sdk|mock-aws-s3|nock/,
          resource => {
            resource.request = require.resolve('./src/lib/mocks/empty-module.js');
          }
        )
      );

      // Fallback-ek minden node-specifikus modulra
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        child_process: false,
        dns: false,
        net: false,
        tls: false,
        assert: false,
        util: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    return config;
  },
  reactStrictMode: true,
  experimental: {
    webpackBuildWorker: true,
  }
};

module.exports = nextConfig; 