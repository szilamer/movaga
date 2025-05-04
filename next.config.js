/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placekitten.com',
      },
      {
        protocol: 'https',
        hostname: 'movaga.onrender.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      }
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
  reactStrictMode: true,
};

// Log whether UploadThing environment variables are set
const hasUploadThingSecret = !!process.env.UPLOADTHING_SECRET;
const hasUploadThingAppId = !!process.env.UPLOADTHING_APP_ID;

console.log(`UploadThing configuration status: 
- UPLOADTHING_SECRET: ${hasUploadThingSecret ? 'Set' : 'Not set'}
- UPLOADTHING_APP_ID: ${hasUploadThingAppId ? 'Set' : 'Not set'}
`);

if (!hasUploadThingSecret || !hasUploadThingAppId) {
  console.warn(`⚠️ UploadThing is not fully configured. Some features may not work as expected.
To fix this, please set the UPLOADTHING_SECRET and UPLOADTHING_APP_ID environment variables in your Render.com dashboard.
For more info, visit: https://docs.uploadthing.com/getting-started/appdir`);
}

module.exports = nextConfig; 