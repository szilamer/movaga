'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

interface Order {
  id: string;
  total: number;
  paymentMethod: string;
}

export default function BankTransferPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.orderId}`);
        if (!response.ok) {
          throw new Error('Hiba történt a rendelés betöltése közben');
        }
        const data = await response.json();
        
        // Ellenőrizzük, hogy banki átutalásos rendelésről van-e szó
        if (data.paymentMethod !== 'Banki átutalás') {
          toast.error('Érvénytelen fizetési mód');
          router.push('/thank-you');
          return;
        }
        
        setOrder(data);
      } catch (error) {
        console.error('Hiba:', error);
        toast.error('Hiba történt a rendelés betöltése közben');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Hiba történt</h1>
          <p className="mb-8 text-gray-600">
            A rendelés nem található vagy nem érhető el.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90"
          >
            Vissza a termékekhez
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold">Banki átutalás adatai</h1>
            <p className="text-gray-600">
              Kérjük, az alábbi adatokkal indítsa el az utalást
            </p>
          </div>

          <div className="space-y-4 rounded-lg bg-blue-50 p-6">
            <div className="flex justify-between">
              <span className="font-medium text-blue-900">Kedvezményezett:</span>
              <span className="text-blue-900">Just Clear Solution Kft.</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-900">Bankszámlaszám:</span>
              <span className="text-blue-900">11715007-21533495</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-900">Összeg:</span>
              <span className="text-blue-900">{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-900">Közlemény:</span>
              <span className="text-blue-900">{order.id}</span>
            </div>
            <p className="mt-4 text-sm text-blue-800">
              Kérjük, a közlemény rovatban mindenképp tüntesse fel a rendelés azonosítót!
            </p>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/thank-you')}
              className="inline-block rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90"
            >
              Rendben, értettem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 