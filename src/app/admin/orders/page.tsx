'use client';

import { useEffect, useState } from 'react';
import OrderDetails from '@/components/orders/OrderDetails';

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
  
  // Szállítási cím
  shippingFullName: string;
  shippingCountry: string;
  shippingCity: string;
  shippingAddress: string;
  shippingZipCode: string;
  shippingPhone?: string;
  
  // Számlázási cím
  billingFullName: string;
  billingCountry: string;
  billingCity: string;
  billingAddress: string;
  billingZipCode: string;
  billingPhone?: string;
  billingCompanyName?: string;
  billingTaxNumber?: string;
  
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

      // Frissítjük a listát a helyi állapotban
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
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

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderDetails
            key={order.id}
            order={order}
            onStatusChange={updateOrderStatus}
            isAdmin={true}
          />
        ))}
      </div>
    </div>
  );
} 
