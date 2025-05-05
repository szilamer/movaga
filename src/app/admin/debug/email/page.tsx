'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminEmailDebugPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderStatus, setOrderStatus] = useState('PROCESSING');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const ORDER_STATUSES = {
    PENDING: 'Függőben',
    PROCESSING: 'Feldolgozás alatt',
    SHIPPED: 'Kiszállítva',
    COMPLETED: 'Teljesítve',
    CANCELLED: 'Törölve',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug/order-email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || undefined,
          orderId: orderId || undefined,
          status: orderStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data);
    } catch (err) {
      console.error('Error testing email:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfig = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug/email-test');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data);
    } catch (err) {
      console.error('Error testing email configuration:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Email Debugging</h1>

      <div className="space-y-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Test Order Status Email</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email cím (opcionális, ha rendelés azonosító meg van adva)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="pelda@email.com"
              />
            </div>

            <div>
              <label htmlFor="orderId" className="mb-1 block text-sm font-medium">
                Rendelés azonosító (opcionális, ha email meg van adva)
              </label>
              <input
                type="text"
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="pl. order-123"
              />
            </div>

            <div>
              <label htmlFor="orderStatus" className="mb-1 block text-sm font-medium">
                Rendelés státusz
              </label>
              <select
                id="orderStatus"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.entries(ORDER_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={loading || (!email && !orderId)}
                className="rounded-md bg-primary px-4 py-2 text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Küldés...' : 'Email küldése'}
              </button>

              <button
                type="button"
                onClick={testEmailConfig}
                disabled={loading}
                className="rounded-md border border-primary bg-white px-4 py-2 text-primary transition hover:bg-gray-50 disabled:opacity-50"
              >
                SMTP konfiguráció teszt
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setResult(null);
                  
                  try {
                    const response = await fetch('/api/debug/check-email-config');
                    const data = await response.json();
                    
                    if (!response.ok) {
                      throw new Error(data.error || 'Something went wrong');
                    }
                    
                    setResult(data);
                  } catch (err) {
                    console.error('Error checking email configuration:', err);
                    setError(err instanceof Error ? err.message : 'Unknown error occurred');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Ellenőrizd a konfigurációt
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            <p className="font-medium">Hiba történt</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Eredmény:</h3>
            <pre className="whitespace-pre-wrap rounded-md bg-gray-100 p-4 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 