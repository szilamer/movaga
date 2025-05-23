import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { join } from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// A beállításokat JSON fájlban tároljuk
const settingsFilePath = join(process.cwd(), 'public/uploads/homepage', 'settings.json');

// Beállítások betöltése
async function getSettings() {
  try {
    if (!existsSync(settingsFilePath)) {
      // Ensure directory exists
      const dir = join(process.cwd(), 'public/uploads/homepage');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      
      const defaultSettings = {
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
      await writeFile(settingsFilePath, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    
    const fileContent = await readFile(settingsFilePath, 'utf8');
    const currentSettingsFromFile = JSON.parse(fileContent);

    // Alapértelmezett értékek, amelyek akkor is léteznek, ha a fájlban nincsenek meg
    const defaultValues = {
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

    // Összefésüljük az alapértelmezett értékeket a fájlból olvasottakkal,
    // ahol a fájlból olvasottak felülírják az alapértelmezetteket.
    return {
      ...defaultValues,
      ...currentSettingsFromFile,
    };

  } catch (error) {
    console.error('Error reading settings:', error);
    // Visszaadja az alapértelmezett beállításokat hiba esetén is
    return {
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

// POST - Szöveges tartalom mentése
export async function POST(request: NextRequest) {
  try {
    // Ellenőrizzük a jogosultságot
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    
    // Ellenőrizzük, hogy az összes szükséges mező megvan-e
    if (!data || typeof data !== 'object') {
      return new NextResponse('Invalid data format.', { status: 400 });
    }

    // Betöltjük a jelenlegi beállításokat
    const currentSettings = await getSettings();
    
    // Frissítjük a szöveges tartalmakat
    const updatedSettings = {
      ...currentSettings,
      heroTitle: data.heroTitle || currentSettings.heroTitle,
      heroSubtitle: data.heroSubtitle || currentSettings.heroSubtitle,
      aboutUsTitle: data.aboutUsTitle || currentSettings.aboutUsTitle,
      aboutUsContent: data.aboutUsContent || currentSettings.aboutUsContent,
      businessPartnersTitle: data.businessPartnersTitle || currentSettings.businessPartnersTitle,
      businessPartnersContent: data.businessPartnersContent || currentSettings.businessPartnersContent,
      useHtmlForAboutUs: data.useHtmlForAboutUs !== undefined ? data.useHtmlForAboutUs : currentSettings.useHtmlForAboutUs,
      useHtmlForBusinessPartners: data.useHtmlForBusinessPartners !== undefined ? data.useHtmlForBusinessPartners : currentSettings.useHtmlForBusinessPartners,
      usePageBackgroundColor: data.usePageBackgroundColor !== undefined ? data.usePageBackgroundColor : currentSettings.usePageBackgroundColor,
      pageBackgroundColor: data.pageBackgroundColor !== undefined ? data.pageBackgroundColor : currentSettings.pageBackgroundColor,
    };
    
    // Mentjük a frissített beállításokat
    await saveSettings(updatedSettings);

    return NextResponse.json({ 
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error saving content:', error);
    return new NextResponse('Error saving content.', { status: 500 });
  }
} 