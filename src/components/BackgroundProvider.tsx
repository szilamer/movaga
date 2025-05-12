'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
// import { getAbsoluteImageUrl } from '@/utils/imageUtils'; // Már nem használjuk

interface HomepageSettings {
  usePageBackgroundColor: boolean;
  pageBackgroundColor: string;
}

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export default function BackgroundProvider({ children }: BackgroundProviderProps) {
  // const [backgroundImage, setBackgroundImage] = useState('/background.jpg'); // Már nem használjuk
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');

  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoading(true);
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/admin/homepage`);
        if (response.ok) {
          const data = await response.json();
          if (data.usePageBackgroundColor && data.pageBackgroundColor) {
            setBackgroundColor(data.pageBackgroundColor);
          } else {
            setBackgroundColor('#FFFFFF');
          }
        } else {
          setBackgroundColor('#FFFFFF');
        }
      } catch (error) {
        setBackgroundColor('#FFFFFF');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor }}
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