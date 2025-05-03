import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { existsSync } from 'fs';

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

    const uploadedFiles = [];
    const uploadDir = join(process.cwd(), 'public/uploads/products');
    
    // Ellenőrizzük, hogy létezik-e a mappa, ha nem, létrehozzuk
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }

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
      
      // Visszaadjuk a publikus URL-t
      uploadedFiles.push(`/uploads/products/${fileName}`);
    }

    return NextResponse.json({ urls: uploadedFiles });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse('Error uploading file.', { status: 500 });
  }
} 
