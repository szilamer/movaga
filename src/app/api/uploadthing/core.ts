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
    console.error("UploadThing errorFormatter triggered:", JSON.stringify(err, null, 2));
    
    // Custom message for missing token error
    if (err?.message?.includes("Missing token")) {
      console.error("UploadThing configuration missing. Please set UPLOADTHING_SECRET and UPLOADTHING_APP_ID environment variables.");
      return { message: "UploadThing not configured. Contact administrator." };
    }
    
    return { message: "Upload error: " + (err?.message || "Unknown error") };
  }
});

// Middleware function to check authentication and permissions
const checkAuth = async () => {
  console.log("checkAuth middleware started");
  try {
    // Check for UploadThing configuration first
    console.log("UPLOADTHING_SECRET is set:", !!process.env.UPLOADTHING_SECRET);
    console.log("UPLOADTHING_APP_ID is set:", !!process.env.UPLOADTHING_APP_ID);
    if (!hasUploadThingConfig) {
      console.error("UploadThing not configured in checkAuth. Missing UPLOADTHING_SECRET and/or UPLOADTHING_APP_ID.");
      throw new Error("UploadThing not configured. Missing UPLOADTHING_SECRET and/or UPLOADTHING_APP_ID.");
    }
    console.log("UploadThing config check passed.");
    
    const session = await getServerSession(authOptions);
    console.log("Session object:", JSON.stringify(session, null, 2));

    if (!session?.user) {
      console.error("Unauthorized: No session or user found.");
      throw new Error('Unauthorized');
    }
    console.log("Session user object:", JSON.stringify(session.user, null, 2));

    // Ellenőrizzük, hogy a felhasználó Admin vagy SuperAdmin-e
    const userRole = session.user.role;
    console.log("User role:", userRole);
    const isAdminUser = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
    if (!isAdminUser) {
      console.error("Forbidden: User does not have ADMIN or SUPERADMIN role.");
      throw new Error('Nincs jogosultsága a művelethez');
    }
    console.log("User is Admin or SuperAdmin. UserId:", session.user.id);

    return { userId: session.user.id };
  } catch (error: any) {
    console.error("Middleware error in checkAuth:", error.message);
    console.error("Full error object in checkAuth:", JSON.stringify(error, null, 2));
    throw error; // Re-throw the error to be handled by the errorFormatter
  }
};

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(checkAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for productImage. UserId:', metadata.userId);
      console.log('File URL:', file.url);

      return { url: file.url };
    }),

  homepageImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(checkAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for homepageImage. UserId:', metadata.userId);
      console.log('File URL:', file.url);

      return { url: file.url };
    }),
} satisfies FileRouter;

// A fájl router típusa
export type OurFileRouter = typeof ourFileRouter; 
