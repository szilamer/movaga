'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

interface HomepageSettings {
  heroBackgroundImage: string;
  pageBackgroundImage: string;
}

interface HomepageEditorProps {
  initialSettings?: HomepageSettings;
}

export function HomepageEditor({ initialSettings }: HomepageEditorProps) {
  const [settings, setSettings] = useState<HomepageSettings>(
    initialSettings || {
      heroBackgroundImage: '/hero-bg.jpg',
      pageBackgroundImage: '/background.jpg',
    }
  );
  const [uploading, setUploading] = useState<{ heroBackground: boolean; pageBackground: boolean }>({
    heroBackground: false,
    pageBackground: false,
  });

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'heroBackground' | 'pageBackground'
  ) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    
    setUploading((prev) => ({
      ...prev,
      [type]: true,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/admin/homepage', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Hiba a feltöltés során');
      }

      const data = await response.json();
      setSettings(data.settings);
      toast.success(`${type === 'heroBackground' ? 'Hero háttér' : 'Oldal háttér'} kép sikeresen feltöltve!`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Hiba történt a kép feltöltése során.');
    } finally {
      setUploading((prev) => ({
        ...prev,
        [type]: false,
      }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Hero háttérkép feltöltés */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Hero háttérkép</h2>
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-lg border">
              <Image
                src={settings.heroBackgroundImage}
                alt="Hero háttérkép"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
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
                disabled={uploading.heroBackground}
              />
              <label
                htmlFor="hero-background-image"
                className="flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                {uploading.heroBackground ? (
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
                src={settings.pageBackgroundImage}
                alt="Oldal háttérkép"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="file"
                id="page-background-image"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'pageBackground')}
                disabled={uploading.pageBackground}
              />
              <label
                htmlFor="page-background-image"
                className="flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                {uploading.pageBackground ? (
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

      {/* Előnézet */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Előnézet</h2>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Hero háttérkép</h3>
          <div className="relative overflow-hidden rounded-lg">
            <div 
              className="h-64 w-full bg-cover bg-center filter grayscale hover:filter-none transition-filter duration-1000"
              style={{ backgroundImage: `url('${settings.heroBackgroundImage}')` }}
            />
            <div className="absolute inset-0 bg-black/60 hover:bg-black/20 transition-colors duration-1000 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 mb-4">
                <Image
                  src="/logo.png"
                  alt="Hero Logo Preview"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xl text-gold-500">Minőség és elegancia minden vásárlónak</p>
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
    </div>
  );
} 