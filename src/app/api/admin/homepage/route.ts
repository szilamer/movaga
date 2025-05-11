import { writeFile, readFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { existsSync } from 'fs';
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from 'cloudinary';
import streamifier from 'streamifier';
import { type HomepageSettings } from '@/lib/settings';

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
const defaultSettings: HomepageSettings = {
  heroBackgroundImage: '/hero-bg.jpg',
  pageBackgroundImage: '/background.jpg',
  usePageBackgroundColor: false,
  pageBackgroundColor: '#FFFFFF',
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
    console.log(`[API Homepage] Directory ${dirPath} does not exist. Creating...`);
    await mkdir(dirPath, { recursive: true });
    console.log(`[API Homepage] Directory ${dirPath} created.`);
  }
}

// Beállítások betöltése
async function getSettings() {
  console.log('[API Homepage] Attempting to get settings...');
  try {
    await ensureDirectoryExists(settingsDir);
    if (!existsSync(settingsFilePath)) {
      console.log(`[API Homepage] Settings file ${settingsFilePath} not found. Creating with default settings.`);
      await writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      console.log('[API Homepage] Default settings written to new file.');
      return defaultSettings;
    }
    const data = await readFile(settingsFilePath, 'utf8');
    console.log('[API Homepage] Settings file read successfully.');
    const settings = JSON.parse(data);
    return { ...defaultSettings, ...settings };
  } catch (error) {
    console.error('[API Homepage] Error reading settings:', error);
    try {
      console.log('[API Homepage] Attempting to write default settings after read error...');
      await ensureDirectoryExists(settingsDir);
      await writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      console.log('[API Homepage] Default settings written after read error.');
    } catch (writeError) {
      console.error('[API Homepage] Failed to write default settings after read error:', writeError);
    }
    return defaultSettings;
  }
}

// Beállítások mentése
async function saveSettings(settings: any) {
  console.log('[API Homepage] Attempting to save settings:', JSON.stringify(settings, null, 2));
  try {
    await ensureDirectoryExists(settingsDir);
    await writeFile(settingsFilePath, JSON.stringify(settings, null, 2));
    console.log(`[API Homepage] Settings successfully saved to ${settingsFilePath}`);
  } catch (error) {
    console.error(`[API Homepage] Error saving settings to ${settingsFilePath}:`, error);
    throw error; // Re-throw to be caught by the route handler
  }
}

// GET - Jelenlegi beállítások lekérése
export async function GET(request: NextRequest) {
  console.log('[API Homepage] GET request received.');
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
    console.warn('[API Homepage] Unauthorized GET request.');
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const settings = await getSettings();
  console.log('[API Homepage] Returning settings for GET request:', JSON.stringify(settings, null, 2));
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
  console.log('[API Homepage] POST request received for image upload.');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      console.warn('[API Homepage] Unauthorized POST request.');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const imageType = data.get('imageType') as string; // 'heroBackground' vagy 'pageBackground'
    const file = data.get('file') as File;

    if (!file) {
      console.warn('[API Homepage] No file received in POST request.');
      return NextResponse.json({ message: 'No file received.' }, { status: 400 });
    }

    if (!imageType || !['heroBackground', 'pageBackground'].includes(imageType)) {
      console.warn(`[API Homepage] Invalid image type: ${imageType}`);
      return NextResponse.json({ message: 'Invalid image type.' }, { status: 400 });
    }

    console.log(`[API Homepage] Processing ${imageType} upload for file: ${file.name}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Egyedi public_id generálása Cloudinary számára
    const timestamp = Date.now();
    const uniqueFilename = `${imageType}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    
    console.log(`[API Homepage] Uploading ${uniqueFilename} to Cloudinary...`);
    const cloudinaryResult = await uploadToCloudinary(buffer, {
      folder: 'movaga/homepage', // Javasolt egy almappát használni Cloudinary-n belül
      public_id: uniqueFilename,
      overwrite: true, // Felülírja, ha már létezik ilyen public_id
    });

    if (!cloudinaryResult || !cloudinaryResult.secure_url) {
      console.error('[API Homepage] Cloudinary upload failed, result:', cloudinaryResult);
      return NextResponse.json({ message: 'Cloudinary upload failed.' }, { status: 500 });
    }
    
    const fileUrl = cloudinaryResult.secure_url;
    console.log(`[API Homepage] File uploaded to Cloudinary: ${fileUrl}`);
    
    const currentSettings = await getSettings();
    console.log('[API Homepage] Current settings before update:', JSON.stringify(currentSettings, null, 2));
    
    const newSettings = { ...currentSettings };
    if (imageType === 'heroBackground') {
      newSettings.heroBackgroundImage = fileUrl;
    } else if (imageType === 'pageBackground') {
      newSettings.pageBackgroundImage = fileUrl;
    }
    
    await saveSettings(newSettings);

    console.log('[API Homepage] POST request successful. Returning settings:', JSON.stringify(newSettings, null, 2));
    return NextResponse.json({ 
      message: 'Image uploaded successfully to Cloudinary!',
      url: fileUrl, // Ezt is visszaadhatjuk, ha a kliensnek szüksége van rá direktben
      settings: newSettings // A teljes frissített beállítások objektum
    });

  } catch (error: any) {
    console.error('[API Homepage] Error processing POST request:', error);
    // Strukturáltabb hibaüzenet
    const errorMessage = error.message || 'Error uploading file.';
    const errorStatus = error.status || 500;
    return NextResponse.json({ message: errorMessage }, { status: errorStatus });
  }
} 