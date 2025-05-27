'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { calculateDiscountedPrice } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  discountPercent: number;
}

export function useDiscount() {
  const { data: session } = useSession();
  const [userDiscountLevel, setUserDiscountLevel] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserDiscount() {
      if (session?.user) {
        try {
          console.log('🔍 Fetching user discount level...');
          // Először lekérjük a pontokat, ami automatikusan frissíti a kedvezményszintet
          const pointsResponse = await fetch('/api/users/points?timeframe=3months');
          if (pointsResponse.ok) {
            const pointsData = await pointsResponse.json();
            console.log('📊 Points data received:', pointsData);
            console.log('🎯 Setting discount level to:', pointsData.discountLevel);
            setUserDiscountLevel(pointsData.discountLevel);
          } else {
            console.log('⚠️ Points API failed, using fallback method');
            // Fallback: eredeti módszer
            const response = await fetch('/api/users/current');
            if (response.ok) {
              const userData: User = await response.json();
              // Convert percentage to level (15% -> 1, 30% -> 2)
              const level = userData.discountPercent === 30 ? 2 : userData.discountPercent === 15 ? 1 : 0;
              console.log('🎯 Fallback: Setting discount level to:', level);
              setUserDiscountLevel(level);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching user discount:', error);
        }
      } else {
        console.log('👤 No session found, setting discount level to 0');
        setUserDiscountLevel(0);
      }
      setLoading(false);
    }

    fetchUserDiscount();
  }, [session]);

  // Függvény a kedvezményes ár kiszámításához
  const getDiscountedPrice = (
    price: number, 
    discountedPrice?: number | null,
    discountLevel1Price?: number | null,
    discountLevel2Price?: number | null
  ) => {
    console.log('💰 Calculating price with:', {
      price,
      discountedPrice,
      discountLevel1Price,
      discountLevel2Price,
      userDiscountLevel,
      loading
    });
    
    const result = calculateDiscountedPrice(
      price, 
      discountedPrice, 
      discountLevel1Price,
      discountLevel2Price,
      userDiscountLevel
    );
    
    console.log('💰 Price calculation result:', result);
    return result;
  };

  return {
    userDiscountLevel,
    getDiscountedPrice,
    loading,
  };
} 