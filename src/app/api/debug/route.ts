import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Csak admin felhasználók számára
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Környezeti változók (biztonságos módon)
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasUploadThingSecret: !!process.env.UPLOADTHING_SECRET,
      hasUploadThingAppId: !!process.env.UPLOADTHING_APP_ID,
    };

    // Uploads mappa ellenőrzése
    const uploadDir = join(process.cwd(), 'public/uploads/products');
    let uploadDirExists = false;
    let uploadedFiles: string[] = [];

    try {
      uploadDirExists = existsSync(uploadDir);
      if (uploadDirExists) {
        uploadedFiles = readdirSync(uploadDir);
      }
    } catch (error) {
      console.error('Error checking upload directory:', error);
    }

    return NextResponse.json({
      env,
      uploads: {
        directory: uploadDir,
        exists: uploadDirExists,
        files: uploadedFiles.slice(0, 10), // Csak az első 10 fájlt küldjük vissza
        totalFiles: uploadedFiles.length
      },
      baseUrl: {
        calculated: process.env.NEXT_PUBLIC_URL || 
                  (process.env.NODE_ENV === 'production' 
                   ? 'https://movaga.onrender.com' 
                   : 'http://localhost:3000'),
        fromEnv: process.env.NEXT_PUBLIC_URL
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 