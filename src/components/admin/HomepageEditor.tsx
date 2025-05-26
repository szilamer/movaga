'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface HomepageSettings {
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
  privacyPolicy?: string;
  termsOfService?: string;
}

interface HomepageEditorProps {
  initialSettings?: HomepageSettings;
}

export function HomepageEditor({ initialSettings }: HomepageEditorProps) {
  const [settings, setSettings] = useState<HomepageSettings>(
    initialSettings || {
      heroBackgroundImage: '/hero-bg.jpg',
      pageBackgroundImage: '',
      usePageBackgroundColor: true,
      pageBackgroundColor: '#FFFFFF',
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

  useEffect(() => {
    if (initialSettings) {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...initialSettings,
        usePageBackgroundColor: initialSettings.usePageBackgroundColor !== undefined ? initialSettings.usePageBackgroundColor : (prevSettings.usePageBackgroundColor || false),
        pageBackgroundColor: initialSettings.pageBackgroundColor !== undefined ? initialSettings.pageBackgroundColor : (prevSettings.pageBackgroundColor || '#FFFFFF'),
      }));
    }
  }, [initialSettings]);

  // Load legal documents on component mount
  useEffect(() => {
    const loadLegalDocuments = async () => {
      try {
        const [privacyResponse, termsResponse] = await Promise.all([
          fetch('/uploads/homepage/adatvedelem.md'),
          fetch('/uploads/homepage/aszf.md')
        ]);

        const privacyContent = privacyResponse.ok ? await privacyResponse.text() : '';
        const termsContent = termsResponse.ok ? await termsResponse.text() : '';

        setSettings(prev => ({
          ...prev,
          privacyPolicy: privacyContent,
          termsOfService: termsContent
        }));
      } catch (error) {
        console.error('Error loading legal documents:', error);
      }
    };

    loadLegalDocuments();
  }, []);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'heroBackground' | 'pageBackground'
  ) => {
    if (type === 'pageBackground' && settings.usePageBackgroundColor) {
      toast.info('Az oldal háttérszín használata aktív, képfeltöltés letiltva ehhez a típushoz.');
      return;
    }
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    setImageUploading((prev) => ({ ...prev, [type]: true }));
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
      setImageUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSettingChange = (field: keyof HomepageSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof HomepageSettings) => {
    setSettings({ ...settings, [field]: e.target.value });
  };

  const handleToggleChange = (field: 'useHtmlForAboutUs' | 'useHtmlForBusinessPartners' | 'usePageBackgroundColor') => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const saveContent = async () => {
    setSaving(true);
    console.log('Settings to save:', settings);
    try {
      const baseUrl = window.location.origin;
      
      // Save homepage settings
      const response = await fetch(`${baseUrl}/api/admin/homepage/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Hiba a mentés során');

      // Save legal documents if they exist
      if (settings.privacyPolicy || settings.termsOfService) {
        const legalResponse = await fetch(`${baseUrl}/api/admin/legal-documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privacyPolicy: settings.privacyPolicy,
            termsOfService: settings.termsOfService
          }),
        });
        if (!legalResponse.ok) {
          console.warn('Legal documents save failed, but homepage settings saved successfully');
        }
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
          <TabsTrigger value="images">Képek és Háttérszín</TabsTrigger>
          <TabsTrigger value="hero">Hero szekció</TabsTrigger>
          <TabsTrigger value="aboutUs">Rólunk szekció</TabsTrigger>
          <TabsTrigger value="businessPartners">Üzleti partnerek szekció</TabsTrigger>
          <TabsTrigger value="legal">Jogi dokumentumok</TabsTrigger>
          <TabsTrigger value="preview">Előnézet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Oldal háttér</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2">
                  <Checkbox
                    id="usePageBackgroundColor"
                    checked={settings.usePageBackgroundColor}
                    onCheckedChange={() => handleToggleChange('usePageBackgroundColor')}
                  />
                  <Label htmlFor="usePageBackgroundColor" className="cursor-pointer text-sm font-medium">
                    Egyszínű háttér használata
                  </Label>
                </div>

                {settings.usePageBackgroundColor ? (
                  <div className="space-y-2">
                    <Label htmlFor="pageBackgroundColor" className="text-sm font-medium">Háttérszín</Label>
                    <Input
                      id="pageBackgroundColor"
                      type="color"
                      value={settings.pageBackgroundColor}
                      onChange={(e) => handleSettingChange('pageBackgroundColor', e.target.value)}
                      className="mt-1 h-10 w-full rounded-md border"
                    />
                    <div 
                      className="mt-2 h-20 w-full rounded-md border"
                      style={{ backgroundColor: settings.pageBackgroundColor }}
                      title={`Előnézeti szín: ${settings.pageBackgroundColor}`}
                    ></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                       <Label htmlFor="page-background-image" className="text-sm font-medium">Oldal háttérkép</Label>
                      <div className="relative mt-1 aspect-video overflow-hidden rounded-lg border">
                        <Image
                          key={settings.pageBackgroundImage + '-page'}
                          src={settings.pageBackgroundImage}
                          alt="Oldal háttérkép előnézet"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 500px"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                      </div>
                    </div>
                    <div className="flex items-center pt-2">
                      <input
                        type="file"
                        id="page-background-image"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'pageBackground')}
                        disabled={imageUploading.pageBackground || settings.usePageBackgroundColor}
                      />
                      <label
                        htmlFor="page-background-image"
                        className={`flex w-full cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
                          settings.usePageBackgroundColor
                            ? 'bg-gray-300 cursor-not-allowed hover:bg-gray-300'
                            : 'bg-primary hover:bg-primary/90'
                        }`}
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
                          'Oldal háttérkép cseréje'
                        )}
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hero" className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
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

        <TabsContent value="legal" className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Adatvédelmi szabályzat</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="privacyPolicy" className="block mb-2 text-sm font-medium text-gray-700">
                    Adatvédelmi szabályzat tartalma (Markdown formátum)
                  </label>
                  <textarea
                    id="privacyPolicy"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[400px] font-mono text-sm"
                    value={settings.privacyPolicy || ''}
                    onChange={(e) => handleTextChange(e, 'privacyPolicy')}
                    placeholder="Adatvédelmi szabályzat tartalma..."
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Ez a tartalom jelenik meg az adatvédelem linkre kattintva. Markdown formátumot használhat.
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Általános Szerződési Feltételek (ÁSZF)</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="termsOfService" className="block mb-2 text-sm font-medium text-gray-700">
                    ÁSZF tartalma (Markdown formátum)
                  </label>
                  <textarea
                    id="termsOfService"
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[400px] font-mono text-sm"
                    value={settings.termsOfService || ''}
                    onChange={(e) => handleTextChange(e, 'termsOfService')}
                    placeholder="ÁSZF tartalma..."
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Ez a tartalom jelenik meg az ÁSZF linkre kattintva. Markdown formátumot használhat.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              onClick={saveContent}
              disabled={saving}
            >
              {saving ? 'Mentés...' : 'Jogi dokumentumok mentése'}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
          <div>
            <h2 className="mb-6 text-2xl font-bold">Előnézet</h2>
            
            <div 
              className="overflow-hidden rounded-lg border shadow-lg"
              style={{
                backgroundImage: settings.usePageBackgroundColor ? 'none' : (settings.pageBackgroundImage ? `url(${settings.pageBackgroundImage})` : 'none'),
                backgroundColor: settings.usePageBackgroundColor ? settings.pageBackgroundColor : '#FFFFFF',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '600px',
              }}
            >
              {/* Hero Section Preview */}
              <div
                className="relative flex h-[400px] items-center justify-center p-8 text-center text-white"
                style={{
                  backgroundImage: settings.heroBackgroundImage ? `url(${settings.heroBackgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/50"></div> {/* Overlay */}
                <div className="relative z-10">
                  <h1 className="text-4xl font-bold md:text-5xl">{settings.heroTitle}</h1>
                  <p className="mt-4 text-lg md:text-xl">{settings.heroSubtitle}</p>
                </div>
              </div>

              {/* About Us Section Preview */}
              <div className="bg-white p-8 md:p-12">
                <h3 className="mb-6 text-center text-2xl font-semibold text-gray-800 md:text-3xl">{settings.aboutUsTitle}</h3>
                {settings.useHtmlForAboutUs ? (
                  <div dangerouslySetInnerHTML={{ __html: settings.aboutUsContent }} className="prose prose-lg mx-auto max-w-3xl text-gray-700" />
                ) : (
                  <p className="mx-auto max-w-3xl text-center text-lg text-gray-700">{settings.aboutUsContent}</p>
                )}
              </div>

              {/* Business Partners Section Preview */}
              <div className="bg-gray-50 p-8 md:p-12">
                <h3 className="mb-6 text-center text-2xl font-semibold text-gray-800 md:text-3xl">{settings.businessPartnersTitle}</h3>
                {settings.useHtmlForBusinessPartners ? (
                  <div dangerouslySetInnerHTML={{ __html: settings.businessPartnersContent }} className="prose prose-lg mx-auto max-w-3xl text-gray-700" />
                ) : (
                  <p className="mx-auto max-w-3xl text-center text-lg text-gray-700">{settings.businessPartnersContent}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end border-t pt-6">
        <Button onClick={saveContent} disabled={saving} className="w-full">
          {saving ? 'Mentés...' : 'Beállítások mentése (szín/kép választás)'}
        </Button>
      </div>
    </div>
  );
} 