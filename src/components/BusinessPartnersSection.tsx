"use client"

import React, { useEffect, useState } from 'react'

interface HomepageSettings {
  businessPartnersTitle: string;
  businessPartnersContent: string;
  useHtmlForBusinessPartners: boolean;
}

export default function BusinessPartnersSection() {
  const [settings, setSettings] = useState<HomepageSettings>({
    businessPartnersTitle: 'Üzleti partnereknek',
    businessPartnersContent: 'Csatlakozz jutalékalapú rendszerünkhöz üzletkötőként, és növeld bevételeidet könnyedén.',
    useHtmlForBusinessPartners: false,
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
            businessPartnersTitle: data.businessPartnersTitle,
            businessPartnersContent: data.businessPartnersContent,
            useHtmlForBusinessPartners: data.useHtmlForBusinessPartners,
          });
        }
      } catch (error) {
        console.error('Error loading homepage settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <section className="bg-black py-12 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-4 text-gold-500">{settings.businessPartnersTitle}</h2>
        {settings.useHtmlForBusinessPartners ? (
          <div 
            className="text-lg text-gray-300" 
            dangerouslySetInnerHTML={{ __html: settings.businessPartnersContent }}
          />
        ) : (
          <p className="text-lg text-gray-300">
            {settings.businessPartnersContent}
          </p>
        )}
      </div>
    </section>
  )
} 
