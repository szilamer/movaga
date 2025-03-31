import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        throw new Error('Unauthorized');
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File URL:', file.url);

      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 