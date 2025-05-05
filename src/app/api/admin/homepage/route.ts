import { writeFile, readFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { existsSync } from 'fs';

// A beállításokat JSON fájlban tároljuk
const settingsFilePath = join(process.cwd(), 'public/uploads/homepage', 'settings.json');

// Alapértelmezett beállítások
const defaultSettings = {
  heroBackgroundImage: '/hero-bg.jpg',
  pageBackgroundImage: '/background.jpg',
  heroTitle: 'Movaga',
  heroSubtitle: 'Minőség és elegancia minden vásárlónak',
  aboutUsTitle: 'Rólunk',
  aboutUsContent: 'A Movaga célja, hogy prémium minőségű termékeket kínáljon felhasználóinak egy modern és felhasználóbarát webáruházon keresztül. Csapatunk elkötelezett a vásárlói élmény és az innováció mellett.',
  businessPartnersTitle: 'Üzleti partnereknek',
  businessPartnersContent: 'Csatlakozz jutalékalapú rendszerünkhöz üzletkötőként, és növeld bevételeidet könnyedén.',
  useHtmlForAboutUs: false,
  useHtmlForBusinessPartners: false,
};

// Beállítások betöltése
async function getSettings() {
  try {
    if (!existsSync(settingsFilePath)) {
      // Ensure directory exists
      const dir = join(process.cwd(), 'public/uploads/homepage');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      
      await writeFile(settingsFilePath, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    
    const data = await readFile(settingsFilePath, 'utf8');
    const settings = JSON.parse(data);
    
    // Make sure all fields are set (backwards compatibility)
    const mergedSettings = { ...defaultSettings, ...settings };
    
    return mergedSettings;
  } catch (error) {
    console.error('Error reading settings:', error);
    return defaultSettings;
  }
}

// Beállítások mentése
async function saveSettings(settings: any) {
  // Ensure directory exists
  const dir = join(process.cwd(), 'public/uploads/homepage');
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  
  await writeFile(settingsFilePath, JSON.stringify(settings));
}

// GET - Jelenlegi beállítások lekérése
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

// POST - Kép feltöltése (hero vagy background)
export async function POST(request: NextRequest) {
  try {
    // Ellenőrizzük a jogosultságot
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.formData();
    const imageType = data.get('type') as string; // 'heroBackground' vagy 'pageBackground'
    const file = data.get('file') as File;

    if (!file) {
      return new NextResponse('No file received.', { status: 400 });
    }

    if (!imageType || !['heroBackground', 'pageBackground'].includes(imageType)) {
      return new NextResponse('Invalid image type.', { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generálunk egy egyedi fájlnevet
    const timestamp = Date.now();
    const fileName = `${imageType}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public/uploads/homepage');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const path = join(uploadDir, fileName);
    
    // Mentjük a fájlt
    await writeFile(path, buffer);
    
    // Publikus URL - production-ben abszolút URL
    let fileUrl = `/uploads/homepage/${fileName}`;
    
    // If in production, prepend the base URL
    if (process.env.NODE_ENV === 'production') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      fileUrl = `${baseUrl}${fileUrl}`;
    }
    
    // Frissítjük a beállításokat
    const settings = await getSettings();
    if (imageType === 'heroBackground') {
      settings.heroBackgroundImage = fileUrl;
    } else {
      settings.pageBackgroundImage = fileUrl;
    }
    
    await saveSettings(settings);

    return NextResponse.json({ 
      url: fileUrl,
      settings
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse('Error uploading file.', { status: 500 });
  }
} 