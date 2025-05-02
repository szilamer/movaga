"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface HomepageSettings {
  heroBackgroundImage: string;
  pageBackgroundImage: string;
}

export default function HeroSection() {
  const [settings, setSettings] = useState<HomepageSettings>({
    heroBackgroundImage: '/hero-bg.jpg',
    pageBackgroundImage: '/background.jpg'
  });

  useEffect(() => {
    // Beállítások betöltése
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/homepage');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading homepage settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <section className="relative group overflow-hidden" style={{ perspective: 800 }}>
      {/* Háttérkép szürke szűrővel, hoverre eltűnik a szürke */}
      <div
        className="w-full h-[600px] bg-cover bg-center filter grayscale group-hover:filter-none transition-filter duration-1000"
        style={{ backgroundImage: `url('${settings.heroBackgroundImage}')` }}
      />
      {/* Fekete átfedés */}
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-colors duration-1000" />
      {/* Szöveg és logó */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gold-500">
        <motion.div
          initial={{ rotateX: 0 }}
          animate={{ rotateX: 3260 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          className="relative w-96 h-96 mb-4"
        >
          <Image
            src="/logo.png"
            alt="Movaga Logo"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
        <p className="text-2xl max-w-xl">Minőség és elegancia minden vásárlónak</p>
      </div>
    </section>
  )
} 
