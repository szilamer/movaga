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
  const [userDiscount, setUserDiscount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserDiscount() {
      if (session?.user) {
        try {
          const response = await fetch('/api/users/current');
          
          if (response.ok) {
            const userData: User = await response.json();
            setUserDiscount(userData.discountPercent);
          }
        } catch (error) {
          console.error('Error fetching user discount:', error);
        }
      }
      setLoading(false);
    }

    fetchUserDiscount();
  }, [session]);

  // Függvény a kedvezményes ár kiszámításához
  const getDiscountedPrice = (price: number, discountedPrice?: number | null) => {
    return calculateDiscountedPrice(price, discountedPrice, userDiscount);
  };

  return {
    userDiscount,
    getDiscountedPrice,
    loading,
  };
} 