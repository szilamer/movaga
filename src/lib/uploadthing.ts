import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth/authOptions';
import { generateReactHelpers } from "@uploadthing/react";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        throw new Error("Unauthorized");
      }
      
      // Ellenőrizzük, hogy a felhasználó Admin vagy SuperAdmin-e
      const isAdminUser = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN';
      if (!isAdminUser) {
        throw new Error('Nincs jogosultsága a művelethez');
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

// A fájl router típusa
export type OurFileRouter = typeof ourFileRouter;

// Generate React hooks for uploadthing
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

// Export components for convenience
export { UploadButton, UploadDropzone } from "@uploadthing/react"; 
