'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { useSession } from 'next-auth/react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  shippingMethod: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
}

export default function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderAndShippingMethod = async () => {
      try {
        // Fetch order details
        const orderResponse = await fetch(`/api/orders/${params.orderId}`);
        if (!orderResponse.ok) {
          throw new Error('Hiba történt a rendelés betöltése közben');
        }
        const orderData = await orderResponse.json();
        setOrder(orderData);

        // Fetch shipping method details
        if (orderData.shippingMethod) {
          const shippingResponse = await fetch(`/api/shipping-methods/${encodeURIComponent(orderData.shippingMethod)}`);
          if (shippingResponse.ok) {
            const shippingData = await shippingResponse.json();
            setShippingMethod(shippingData);
          }
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
        console.error('Hiba:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndShippingMethod();
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error || 'A rendelés nem található'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold">Köszönjük a rendelését!</h1>
            <p className="text-gray-600">
              A rendelés visszaigazolását elküldtük e-mailben.
            </p>
          </div>

          <div className="mb-6">
            <div className="mb-4 flex justify-between border-b pb-4">
              <span className="font-medium">Rendelés azonosító:</span>
              <span>{order.id}</span>
            </div>
            <div className="mb-4 flex justify-between">
              <span className="font-medium">Dátum:</span>
              <span>
                {format(new Date(order.createdAt), 'yyyy.MM.dd HH:mm', {
                  locale: hu,
                })}
              </span>
            </div>
            <div className="mb-4 flex justify-between">
              <span className="font-medium">Státusz:</span>
              <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                Függőben
              </span>
            </div>
            <div className="mb-4 flex justify-between">
              <span className="font-medium">Szállítási mód:</span>
              <div>
                <span>{order.shippingMethod}</span>
                {shippingMethod && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({formatPrice(shippingMethod.price)})
                  </span>
                )}
              </div>
            </div>
            <div className="mb-4 flex justify-between">
              <span className="font-medium">Fizetési mód:</span>
              <span>{order.paymentMethod}</span>
            </div>
            {order.paymentMethod === 'Banki átutalás' && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-800">Banki átutalás adatai</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <p><span className="font-medium">Kedvezményezett:</span> Movaga Kft.</p>
                  <p><span className="font-medium">Bankszámlaszám:</span> 11111111-22222222-33333333</p>
                  <p><span className="font-medium">Közlemény:</span> {order.id}</p>
                  <p><span className="font-medium">Összeg:</span> {formatPrice(order.total)}</p>
                  <p className="mt-2 text-xs">Kérjük, a közlemény rovatban mindenképp tüntesse fel a rendelés azonosítót!</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold">Rendelt termékek</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.product.name}</span>
                    <span className="text-gray-500"> × {item.quantity}</span>
                  </div>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Végösszeg:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/products')}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Vásárlás folytatása
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 