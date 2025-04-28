'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentId = searchParams.get('PaymentId');
    const status = searchParams.get('Status');

    if (status === 'Succeeded') {
      toast.success('A fizetés sikeresen megtörtént!');
      // Átirányítás a thank you oldalra
      router.push('/thank-you');
    } else {
      toast.error('A fizetés sikertelen volt. Kérjük, próbáld újra!');
      // Átirányítás vissza a checkout oldalra
      router.push('/checkout');
    }
  }, [router, searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-lg">Fizetés feldolgozása...</p>
      </div>
    </div>
  );
} 