/** @type {import('next').NextConfig} */
const path = require('path');

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
      // 1. Módosítjuk a base rule-t, hogy kihagyja a node_modules-t
      config.module.rules.forEach((rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach((oneOfRule) => {
            if (oneOfRule.issuer && oneOfRule.issuer.and && oneOfRule.issuer.and.length > 0) {
              oneOfRule.issuer.and = oneOfRule.issuer.and.map((issuer) => {
                if (issuer.source) {
                  return {
                    ...issuer,
                    source: issuer.source.replace(
                      /^((?!node_modules).)*$/,
                      /^((?!(node_modules\/(bcrypt|@mapbox\/node-pre-gyp))).)*$/
                    ),
                  };
                }
                return issuer;
              });
            }
          });
        }
      });

      // 2. Minden problémás modult kizárunk
      config.module.rules.push({
        test: /node_modules[\/\\](bcrypt|@mapbox\/node-pre-gyp|aws-sdk|mock-aws-s3|nock)/,
        use: 'ignore-loader',
      });

      // 3. Külön kezelés a html fájlhoz
      config.module.rules.push({
        test: /\.html$/,
        include: [
          path.resolve(__dirname, 'node_modules/@mapbox/node-pre-gyp'),
        ],
        use: 'ignore-loader',
      });

      // 4. Fallback minden node-specifikus modulra
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