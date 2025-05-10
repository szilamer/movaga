import { writeFile, readFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { existsSync } from 'fs';
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';

// Cloudinary konfiguráció (győződj meg róla, hogy a környezeti változók be vannak állítva)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// A beállításokat JSON fájlban tároljuk
const settingsFilePath = join(process.cwd(), 'public/uploads/homepage', 'settings.json');
const settingsDir = join(process.cwd(), 'public/uploads/homepage');

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

// Segédfüggvény a könyvtár létrehozásához, ha nem létezik
async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// Beállítások betöltése
async function getSettings() {
  try {
    await ensureDirectoryExists(settingsDir);
    if (!existsSync(settingsFilePath)) {
      await writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = await readFile(settingsFilePath, 'utf8');
    const settings = JSON.parse(data);
    return { ...defaultSettings, ...settings };
  } catch (error) {
    console.error('Error reading settings:', error);
    // Hiba esetén is biztosítjuk, hogy a könyvtár létezzen és az alapbeállítások elmentésre kerüljenek, ha a fájl nem olvasható
    try {
      await ensureDirectoryExists(settingsDir);
      await writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
    } catch (writeError) {
      console.error('Failed to write default settings after read error:', writeError);
    }
    return defaultSettings;
  }
}

// Beállítások mentése
async function saveSettings(settings: any) {
  await ensureDirectoryExists(settingsDir);
  await writeFile(settingsFilePath, JSON.stringify(settings, null, 2));
}

// GET - Jelenlegi beállítások lekérése
export async function GET(request: NextRequest) {
  // Ellenőrizzük a jogosultságot (opcionális GET esetén, de admin felületnél ajánlott)
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
    // Itt dönthetsz úgy, hogy hibát dobsz, vagy pl. csak a publikus adatokat adod vissza, ha van értelme
    // Mivel ez admin API, a 401/403 helyénvalóbb
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json(settings);
}

// Cloudinary feltöltő segédfüggvény
const uploadToCloudinary = (buffer: Buffer, options: any): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
      if (error) return reject(error);
      if (result) return resolve(result);
      return reject(new Error('Cloudinary upload failed without error object.'));
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// POST - Kép feltöltése (hero vagy background) Cloudinary-ra
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const imageType = data.get('imageType') as string; // 'heroBackground' vagy 'pageBackground'
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file received.' }, { status: 400 });
    }

    if (!imageType || !['heroBackground', 'pageBackground'].includes(imageType)) {
      return NextResponse.json({ message: 'Invalid image type.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Egyedi public_id generálása Cloudinary számára
    const timestamp = Date.now();
    const uniqueFilename = `${imageType}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    
    const cloudinaryResult = await uploadToCloudinary(buffer, {
      folder: 'movaga/homepage', // Javasolt egy almappát használni Cloudinary-n belül
      public_id: uniqueFilename,
      overwrite: true, // Felülírja, ha már létezik ilyen public_id
    });

    if (!cloudinaryResult || !cloudinaryResult.secure_url) {
      console.error('Cloudinary upload failed, result:', cloudinaryResult);
      return NextResponse.json({ message: 'Cloudinary upload failed.' }, { status: 500 });
    }
    
    const fileUrl = cloudinaryResult.secure_url;
    
    const settings = await getSettings();
    if (imageType === 'heroBackground') {
      settings.heroBackgroundImage = fileUrl;
    } else if (imageType === 'pageBackground') {
      settings.pageBackgroundImage = fileUrl;
    }
    
    await saveSettings(settings);

    // A kliens az új 'settings' objektumot várja a válaszban
    return NextResponse.json({ 
      message: 'Image uploaded successfully to Cloudinary!',
      url: fileUrl, // Ezt is visszaadhatjuk, ha a kliensnek szüksége van rá direktben
      settings // A teljes frissített beállítások objektum
    });

  } catch (error: any) {
    console.error('Error processing homepage image upload:', error);
    // Strukturáltabb hibaüzenet
    const errorMessage = error.message || 'Error uploading file.';
    const errorStatus = error.status || 500;
    return NextResponse.json({ message: errorMessage }, { status: errorStatus });
  }
} 