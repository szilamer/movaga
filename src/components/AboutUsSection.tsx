"use client"

import React, { useEffect, useState } from 'react'

interface HomepageSettings {
  aboutUsTitle: string;
  aboutUsContent: string;
  useHtmlForAboutUs: boolean;
}

export default function AboutUsSection() {
  const [settings, setSettings] = useState<HomepageSettings>({
    aboutUsTitle: 'Rólunk',
    aboutUsContent: 'A Movaga célja, hogy prémium minőségű termékeket kínáljon felhasználóinak egy modern és felhasználóbarát webáruházon keresztül. Csapatunk elkötelezett a vásárlói élmény és az innováció mellett.',
    useHtmlForAboutUs: false,
  });

  useEffect(() => {
    // Beállítások betöltése
    const fetchSettings = async () => {
      try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/admin/homepage`);
        if (response.ok) {
          const data = await response.json();
          setSettings({
            aboutUsTitle: data.aboutUsTitle,
            aboutUsContent: data.aboutUsContent,
            useHtmlForAboutUs: data.useHtmlForAboutUs,
          });
        }
      } catch (error) {
        console.error('Error loading homepage settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-4 text-black">{settings.aboutUsTitle}</h2>
      {settings.useHtmlForAboutUs ? (
        <div 
          className="text-lg text-gray-700 max-w-3xl" 
          dangerouslySetInnerHTML={{ __html: settings.aboutUsContent }}
        />
      ) : (
        <p className="text-lg text-gray-700 max-w-3xl">
          {settings.aboutUsContent}
        </p>
      )}
    </section>
  )
} 
