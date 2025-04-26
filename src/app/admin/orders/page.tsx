'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

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
  user: {
    name: string;
    email: string;
  };
}

const ORDER_STATUSES = {
  PENDING: { label: 'Függőben', color: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'Feldolgozás alatt', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Kiszállítva', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Teljesítve', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Törölve', color: 'bg-red-100 text-red-800' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        throw new Error('Hiba történt a rendelések betöltése közben');
      }
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
      console.error('Hiba:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Hiba történt a státusz módosítása közben');
      }

      // Frissítjük a listát
      await fetchOrders();
    } catch (err) {
      console.error('Hiba:', err);
      alert(err instanceof Error ? err.message : 'Hiba történt a státusz módosítása közben');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Rendelések kezelése</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rendelés azonosító
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Dátum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Vásárló
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Összeg
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Státusz
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Műveletek
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="font-medium">{order.id}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {format(new Date(order.createdAt), 'yyyy.MM.dd HH:mm', { locale: hu })}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{order.user.name}</div>
                    <div className="text-sm text-gray-500">{order.user.email}</div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium">
                  {formatPrice(order.total)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.color
                    }`}
                  >
                    {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="rounded-md bg-background text-foreground border-border text-sm shadow-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
                  >
                    {Object.entries(ORDER_STATUSES).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
