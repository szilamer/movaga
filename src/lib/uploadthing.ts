import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Generate React hooks for uploadthing
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

// Export components for convenience
export { UploadButton, UploadDropzone } from "@uploadthing/react"; 