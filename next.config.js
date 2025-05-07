/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'movaga.onrender.com', 'movaga.hu', 'res.cloudinary.com'], // Legacy fallback
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
        protocol: 'https',
        hostname: 'movaga.hu',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
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
      ? 'https://movaga.hu' 
      : 'http://localhost:3000',
    NEXT_PUBLIC_URL: process.env.NODE_ENV === 'production' 
      ? 'https://movaga.hu' 
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

// Log UploadThing environment variables status
const hasUploadThingSecret = !!process.env.UPLOADTHING_SECRET;
const hasUploadThingAppId = !!process.env.UPLOADTHING_APP_ID;

console.log(`UploadThing configuration status: 
- UPLOADTHING_SECRET: ${hasUploadThingSecret ? 'Set' : 'Not set'}
- UPLOADTHING_APP_ID: ${hasUploadThingAppId ? 'Set' : 'Not set'}
`);

// Log Cloudinary status
const hasCloudinaryConfig = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

console.log(`Cloudinary configuration status: ${hasCloudinaryConfig ? 'Available' : 'Not configured'}`);

// Warning messages
if (!hasUploadThingSecret || !hasUploadThingAppId) {
  console.warn(`⚠️ UploadThing is not fully configured. Some features may not work as expected.`);
}

if (!hasCloudinaryConfig) {
  console.warn(`⚠️ Cloudinary is not configured. For production image uploads, please set the following environment variables:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
Learn more at https://cloudinary.com/documentation/node_integration`);
}

module.exports = nextConfig; 