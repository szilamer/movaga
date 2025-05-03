'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';

interface HomepageSettings {
  heroBackgroundImage: string;
  pageBackgroundImage: string;
}

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export default function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [backgroundImage, setBackgroundImage] = useState('/background.jpg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Beállítások betöltése
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // Use absolute URL in production
        const baseUrl = process.env.NEXT_PUBLIC_URL || '';
        const response = await fetch(`${baseUrl}/api/admin/homepage`);
        if (response.ok) {
          const data = await response.json();
          
          // Ensure the image URL is absolute
          const bgImage = data.pageBackgroundImage || '/background.jpg';
          setBackgroundImage(getAbsoluteImageUrl(bgImage));
        }
      } catch (error) {
        console.error('Error loading homepage settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 