'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface HomepageSettings {
  heroBackgroundImage: string;
  pageBackgroundImage: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutUsTitle: string;
  aboutUsContent: string;
  businessPartnersTitle: string;
  businessPartnersContent: string;
  useHtmlForAboutUs: boolean;
  useHtmlForBusinessPartners: boolean;
}

interface HomepageEditorProps {
  initialSettings?: HomepageSettings;
}

export function HomepageEditor({ initialSettings }: HomepageEditorProps) {
  const [settings, setSettings] = useState<HomepageSettings>(
    initialSettings || {
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
    }
  );
  const [imageUploading, setImageUploading] = useState<{ heroBackground: boolean; pageBackground: boolean }>({
    heroBackground: false,
    pageBackground: false,
  });
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'heroBackground' | 'pageBackground'
  ) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    
    setImageUploading((prev) => ({
      ...prev,
      [type]: true,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', type);

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/admin/homepage`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Hiba a feltöltés során' }));
        throw new Error(errorData.message || 'Hiba a feltöltés során');
      }

      const data = await response.json();
      const newSettings = { ...data.settings }; 
      setSettings(newSettings);
      
      const newImageUrl = type === 'heroBackground' ? newSettings.heroBackgroundImage : newSettings.pageBackgroundImage;
      console.log(`Updated ${type} URL in state:`, newImageUrl);
      toast.info(`Kép URL frissítve a komponens állapotában: ${newImageUrl}`, { duration: 10000 });

      toast.success(`${type === 'heroBackground' ? 'Hero háttér' : 'Oldal háttér'} kép sikeresen feltöltve és mentve a szerverre!`);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Hiba történt a kép feltöltése során.');
    } finally {
      setImageUploading((prev) => ({
        ...prev,
        [type]: false,
      }));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof HomepageSettings) => {
    setSettings({
      ...settings,
      [field]: e.target.value
    });
  };

  const handleToggleChange = (field: 'useHtmlForAboutUs' | 'useHtmlForBusinessPartners') => {
    setSettings({
      ...settings,
      [field]: !settings[field]
    });
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/admin/homepage/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Hiba a mentés során');
      }

      toast.success('Tartalom sikeresen mentve!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Hiba történt a tartalom mentése során.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="images">
        <TabsList className="mb-6">
          <TabsTrigger value="images">Képek</TabsTrigger>
          <TabsTrigger value="hero">Hero szekció</TabsTrigger>
          <TabsTrigger value="aboutUs">Rólunk szekció</TabsTrigger>
          <TabsTrigger value="businessPartners">Üzleti partnerek szekció</TabsTrigger>
          <TabsTrigger value="preview">Előnézet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Hero háttérkép feltöltés */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Hero háttérkép</h2>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <Image
                    key={settings.heroBackgroundImage}
                    src={settings.heroBackgroundImage}
                    alt="Hero háttérkép"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="file"
                    id="hero-background-image"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'heroBackground')}
                    disabled={imageUploading.heroBackground}
                  />
                  <label
                    htmlFor="hero-background-image"
                    className="flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                  >
                    {imageUploading.heroBackground ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Feltöltés...
                      </>
                    ) : (
                      'Hero háttérkép feltöltése'
                    )}
                  </label>
                </div>
                
                <p className="text-sm text-gray-500">
                  Javasolt méret: 1920x1080 pixel, max 2MB. Ez a kép a főoldal felső részének háttere, amin a szürke szűrő és elsötétedés van.
                </p>
              </div>
            </div>

            {/* Oldal háttérkép feltöltés */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Oldal háttérkép</h2>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <Image
                    key={settings.pageBackgroundImage}
                    src={settings.pageBackgroundImage}
                    alt="Oldal háttérkép"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                    unoptimized
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="file"
                    id="page-background-image"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'pageBackground')}
                    disabled={imageUploading.pageBackground}
                  />
                  <label
                    htmlFor="page-background-image"
                    className="flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                  >
                    {imageUploading.pageBackground ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Feltöltés...
                      </>
                    ) : (
                      'Oldal háttérkép feltöltése'
                    )}
                  </label>
                </div>
                
                <p className="text-sm text-gray-500">
                  Javasolt méret: 1920x1080 pixel, max 2MB. Ez a kép a teljes oldal háttere.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hero" className="space-y-8">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Hero szekció szövegei</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="heroTitle" className="block mb-2 text-sm font-medium text-gray-700">
                  Cím
                </label>
                <input
                  type="text"
                  id="heroTitle"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.heroTitle}
                  onChange={(e) => handleTextChange(e, 'heroTitle')}
                />
              </div>

              <div>
                <label htmlFor="heroSubtitle" className="block mb-2 text-sm font-medium text-gray-700">
                  Alcím
                </label>
                <input
                  type="text"
                  id="heroSubtitle"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.heroSubtitle}
                  onChange={(e) => handleTextChange(e, 'heroSubtitle')}
                />
              </div>

              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                onClick={saveContent}
                disabled={saving}
              >
                {saving ? 'Mentés...' : 'Mentés'}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="aboutUs" className="space-y-8">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Rólunk szekció</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="aboutUsTitle" className="block mb-2 text-sm font-medium text-gray-700">
                  Cím
                </label>
                <input
                  type="text"
                  id="aboutUsTitle"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.aboutUsTitle}
                  onChange={(e) => handleTextChange(e, 'aboutUsTitle')}
                />
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="useHtmlForAboutUs"
                  checked={settings.useHtmlForAboutUs}
                  onChange={() => handleToggleChange('useHtmlForAboutUs')}
                  className="mr-2"
                />
                <label htmlFor="useHtmlForAboutUs" className="text-sm font-medium text-gray-700">
                  HTML tartalom használata
                </label>
              </div>

              <div>
                <label htmlFor="aboutUsContent" className="block mb-2 text-sm font-medium text-gray-700">
                  Tartalom {settings.useHtmlForAboutUs ? '(HTML megengedett)' : ''}
                </label>
                <textarea
                  id="aboutUsContent"
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[200px]"
                  value={settings.aboutUsContent}
                  onChange={(e) => handleTextChange(e, 'aboutUsContent')}
                />
              </div>

              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                onClick={saveContent}
                disabled={saving}
              >
                {saving ? 'Mentés...' : 'Mentés'}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="businessPartners" className="space-y-8">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Üzleti partnerek szekció</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="businessPartnersTitle" className="block mb-2 text-sm font-medium text-gray-700">
                  Cím
                </label>
                <input
                  type="text"
                  id="businessPartnersTitle"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.businessPartnersTitle}
                  onChange={(e) => handleTextChange(e, 'businessPartnersTitle')}
                />
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="useHtmlForBusinessPartners"
                  checked={settings.useHtmlForBusinessPartners}
                  onChange={() => handleToggleChange('useHtmlForBusinessPartners')}
                  className="mr-2"
                />
                <label htmlFor="useHtmlForBusinessPartners" className="text-sm font-medium text-gray-700">
                  HTML tartalom használata
                </label>
              </div>

              <div>
                <label htmlFor="businessPartnersContent" className="block mb-2 text-sm font-medium text-gray-700">
                  Tartalom {settings.useHtmlForBusinessPartners ? '(HTML megengedett)' : ''}
                </label>
                <textarea
                  id="businessPartnersContent"
                  className="w-full p-2 border border-gray-300 rounded-md min-h-[200px]"
                  value={settings.businessPartnersContent}
                  onChange={(e) => handleTextChange(e, 'businessPartnersContent')}
                />
              </div>

              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                onClick={saveContent}
                disabled={saving}
              >
                {saving ? 'Mentés...' : 'Mentés'}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-8">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Előnézet</h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Hero szekció</h3>
                <div className="relative overflow-hidden rounded-lg">
                  <div 
                    className="h-64 w-full bg-cover bg-center filter grayscale hover:filter-none transition-filter duration-1000"
                    style={{ backgroundImage: `url('${settings.heroBackgroundImage}')` }}
                  />
                  <div className="absolute inset-0 bg-black/60 hover:bg-black/20 transition-colors duration-1000 flex flex-col items-center justify-center">
                    <div className="relative w-40 h-40 mb-4">
                      <Image
                        src={getAbsoluteImageUrl('/logo.png')}
                        alt="Hero Logo Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-xl text-gold-500">{settings.heroSubtitle}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Rólunk szekció</h3>
                <div className="rounded-lg border p-4">
                  <h4 className="text-xl font-bold mb-2">{settings.aboutUsTitle}</h4>
                  {settings.useHtmlForAboutUs ? (
                    <div dangerouslySetInnerHTML={{ __html: settings.aboutUsContent }} />
                  ) : (
                    <p>{settings.aboutUsContent}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Üzleti partnerek szekció</h3>
                <div className="rounded-lg border p-4 bg-black text-white">
                  <h4 className="text-xl font-bold mb-2 text-gold-500">{settings.businessPartnersTitle}</h4>
                  {settings.useHtmlForBusinessPartners ? (
                    <div dangerouslySetInnerHTML={{ __html: settings.businessPartnersContent }} className="text-gray-300" />
                  ) : (
                    <p className="text-gray-300">{settings.businessPartnersContent}</p>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Oldal háttérkép</h3>
              <div 
                className="h-32 w-full rounded-lg bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('${settings.pageBackgroundImage}')` }}
              />
              <p className="text-sm text-gray-500">Az oldal háttérkép a teljes weboldal hátterében jelenik meg.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 