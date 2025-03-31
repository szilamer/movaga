import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { generateComponents } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      const session = await getServerSession();

      if (!session?.user) throw new Error("Unauthorized");
      
      const user = session.user;

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>(); 