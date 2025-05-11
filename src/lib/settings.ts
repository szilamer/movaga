import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export interface HomepageSettings {
  heroBackgroundImage: string;
  pageBackgroundImage: string;
  usePageBackgroundColor: boolean;
  pageBackgroundColor: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutUsTitle: string;
  aboutUsContent: string;
  businessPartnersTitle: string;
  businessPartnersContent: string;
  useHtmlForAboutUs: boolean;
  useHtmlForBusinessPartners: boolean;
}

const settingsFilePath = join(process.cwd(), 'public/uploads/homepage', 'settings.json');

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

export async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    if (!existsSync(settingsFilePath)) {
      const dir = join(process.cwd(), 'public/uploads/homepage');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }

    const fileContent = await readFile(settingsFilePath, 'utf8');
    const currentSettingsFromFile = JSON.parse(fileContent) as Partial<HomepageSettings>;
    
    // Összefésüljük az alapértelmezett értékeket a fájlból olvasottakkal,
    // biztosítva, hogy minden mezőnek legyen értéke.
    return {
      ...defaultSettings,
      ...currentSettingsFromFile,
    };
  } catch (error) {
    console.error('[HOMEPAGE_SETTINGS_ERROR] Error reading homepage settings:', error);
    // Hiba esetén is a teljes alapértelmezett objektumot adjuk vissza
    return defaultSettings;
  }
} 