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
      // Teljesen kizárjuk a bcrypt-et és függőségeit a kliens oldalról
      config.resolve.alias = {
        ...config.resolve.alias,
        bcrypt: false,
        '@mapbox/node-pre-gyp': false,
        'aws-sdk': false,
        'mock-aws-s3': false,
        'nock': false,
      };
      
      // Fallback-ek minden node-specifikus modulra
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bcrypt: false,
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
      
      // Kizárjuk a bcrypt-et és minden függőségét a webpack feldolgozásból
      config.module.rules.push({
        test: /node_modules\/(@mapbox\/node-pre-gyp|bcrypt|aws-sdk|mock-aws-s3|nock)/,
        use: 'null-loader',
      });
    }
    
    return config;
  },
  reactStrictMode: true,
  experimental: {
    webpackBuildWorker: true,
  }
};

module.exports = nextConfig; 