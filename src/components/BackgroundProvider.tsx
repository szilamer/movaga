'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
// import { getAbsoluteImageUrl } from '@/utils/imageUtils'; // Már nem használjuk

// interface HomepageSettings { // Már nem használjuk
//   heroBackgroundImage: string;
//   pageBackgroundImage: string;
// }

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export default function BackgroundProvider({ children }: BackgroundProviderProps) {
  // const [backgroundImage, setBackgroundImage] = useState('/background.jpg'); // Már nem használjuk
  const [isLoading, setIsLoading] = useState(true); // A loading state-et egyelőre meghagyjuk

  useEffect(() => {
    // // Beállítások betöltése - Ezt a részt kikommentezzük vagy töröljük
    // const fetchSettings = async () => {
    //   try {
    //     setIsLoading(true);
    //     // Use absolute URL in production
    //     const baseUrl = process.env.NEXT_PUBLIC_URL || '';
    //     const response = await fetch(`${baseUrl}/api/admin/homepage`);
    //     if (response.ok) {
    //       const data = await response.json();
    //       
    //       // Ensure the image URL is absolute
    //       const bgImage = data.pageBackgroundImage || '/background.jpg';
    //       // setBackgroundImage(getAbsoluteImageUrl(bgImage)); // Már nem állítunk be háttérképet itt
    //     }
    //   } catch (error) {
    //     console.error('Error loading homepage settings in BackgroundProvider:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    // fetchSettings();
    
    // Egyszerűen csak a loading state-et kezeljük itt, ha szükséges
    // Például, ha van valamilyen globális adat, amire várunk betöltődni.
    // Jelenleg nincs ilyen, így a loading state is eltávolítható lenne, ha nincs rá szükség másutt.
    const timer = setTimeout(() => setIsLoading(false), 50); // Rövid késleltetés a példa kedvéért, vagy valós feltétel alapján
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="min-h-screen" // Levesszük a bg-cover, bg-center, bg-fixed osztályokat
      // style={{ backgroundImage: `url('${backgroundImage}')` }} // Eltávolítjuk a style-t
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