import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

// Check if UploadThing environment variables are set
const hasUploadThingConfig = !!(process.env.UPLOADTHING_SECRET && process.env.UPLOADTHING_APP_ID);

// A token beállításához használd a UPLOADTHING_SECRET és UPLOADTHING_APP_ID környezeti változókat
// a Render.com dashboard-on vagy egy .env.local fájlban!
const f = createUploadthing({
  errorFormatter: (err) => {
    // Log the error for debugging
    console.error("UploadThing error:", err);
    
    // Custom message for missing token error
    if (err?.message?.includes("Missing token")) {
      console.error("UploadThing configuration missing. Please set UPLOADTHING_SECRET and UPLOADTHING_APP_ID environment variables.");
      return { message: "UploadThing not configured. Contact administrator." };
    }
    
    return { message: "Upload error: " + (err?.message || "Unknown error") };
  }
});

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(async () => {
      try {
        // Check for UploadThing configuration first
        if (!hasUploadThingConfig) {
          throw new Error("UploadThing not configured. Missing UPLOADTHING_SECRET and/or UPLOADTHING_APP_ID.");
        }
        
        const session = await getServerSession(authOptions);

        if (!session?.user) {
          throw new Error('Unauthorized');
        }

        // Ellenőrizzük, hogy a felhasználó Admin vagy SuperAdmin-e
        const isAdminUser = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN';
        if (!isAdminUser) {
          throw new Error('Nincs jogosultsága a művelethez');
        }

        return { userId: session.user.id };
      } catch (error) {
        console.error("Middleware error:", error);
        throw new Error("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File URL:', file.url);

      return { url: file.url };
    }),

  homepageImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      try {
        // Check for UploadThing configuration first
        if (!hasUploadThingConfig) {
          throw new Error("UploadThing not configured. Missing UPLOADTHING_SECRET and/or UPLOADTHING_APP_ID.");
        }
        
        const session = await getServerSession(authOptions);

        if (!session?.user) {
          throw new Error('Unauthorized');
        }

        // Ellenőrizzük, hogy a felhasználó Admin vagy SuperAdmin-e
        const isAdminUser = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN';
        if (!isAdminUser) {
          throw new Error('Nincs jogosultsága a művelethez');
        }

        return { userId: session.user.id };
      } catch (error) {
        console.error("Middleware error:", error);
        throw new Error("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File URL:', file.url);

      return { url: file.url };
    }),
} satisfies FileRouter;

// A fájl router típusa
export type OurFileRouter = typeof ourFileRouter; 
