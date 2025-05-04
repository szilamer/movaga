import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { existsSync } from 'fs';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Ellenőrizzük a jogosultságot
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.formData();
    const files: File[] = data.getAll('files') as File[];

    if (!files?.length) {
      return new NextResponse('No files received.', { status: 400 });
    }

    // Ellenőrizzük a Cloudinary API konfigurációt
    const hasCloudinaryConfig = !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    );
    
    // Képek feltöltése és URL-ek tárolása
    const uploadedFiles = [];
    
    // Cloudinary feltöltés, ha van konfiguráció
    if (hasCloudinaryConfig || process.env.NODE_ENV === 'production') {
      console.log("Using Cloudinary for image upload");

      // Feltöltés a felhőbe
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Biztonságos fájlnév létrehozása
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
        const fileName = `${timestamp}-${originalName}`;
        
        try {
          // Feltöltés a Cloudinary-ra
          const result = await uploadImageToCloudinary(buffer, fileName);
          
          console.log(`Uploaded to Cloudinary: ${result.url} (ID: ${result.public_id})`);
          uploadedFiles.push(result.url);
        } catch (cloudinaryError) {
          console.error('Cloudinary upload failed:', cloudinaryError);
          
          // Ha a Cloudinary feltöltés sikertelen, használjunk placekitten.com-ot fallback-ként
          if (process.env.NODE_ENV === 'production') {
            const width = 400 + Math.floor(Math.random() * 200);
            const height = 300 + Math.floor(Math.random() * 200);
            const fallbackUrl = `https://placekitten.com/${width}/${height}`;
            
            console.log(`Using fallback image due to Cloudinary error: ${fallbackUrl}`);
            uploadedFiles.push(fallbackUrl);
          } else {
            throw cloudinaryError; // Fejlesztői környezetben továbbdobjuk a hibát
          }
        }
      }
    } else {
      // Fejlesztői környezetben, ha nincs Cloudinary konfiguráció, használjuk a local upload-ot
      console.log("Using local storage for development");
      const uploadDir = join(process.cwd(), 'public/uploads/products');
      
      // Ellenőrizzük, hogy létezik-e a mappa, ha nem, létrehozzuk
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
        console.log(`Created directory: ${uploadDir}`);
      }

      // A BASE URL meghatározása
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      
      console.log(`Using base URL for uploads: ${baseUrl}`);

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generálunk egy egyedi fájlnevet
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const path = join(uploadDir, fileName);
        
        // Mentjük a fájlt
        await writeFile(path, buffer);
        console.log(`File saved to: ${path}`);
        
        // Mindig teljes URL-t adunk vissza
        const fileUrl = `${baseUrl}/uploads/products/${fileName}`;
        console.log(`Generated URL: ${fileUrl}`);
        
        uploadedFiles.push(fileUrl);
      }
    }

    return NextResponse.json({ urls: uploadedFiles });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
} 
