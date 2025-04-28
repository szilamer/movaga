'use client';

import { useState } from 'react';
import { BarionPayment } from '@/components/Payment/BarionPayment';

export default function PaymentTestPage() {
  const [amount, setAmount] = useState<number>(1000);
  const [status, setStatus] = useState<string>('');

  const handleSuccess = (paymentId: string) => {
    setStatus(`Payment successful! Payment ID: ${paymentId}`);
  };

  const handleError = (error: Error) => {
    setStatus(`Payment failed: ${error.message}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Barion Payment Test</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Amount (HUF)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <BarionPayment
        posKey={process.env.NEXT_PUBLIC_BARION_POS_KEY || ''}
        amount={amount}
        currency="HUF"
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {status && (
        <div className="mt-4 p-4 rounded-md bg-gray-100">
          <p className="text-sm">{status}</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Test Cards</h2>
        <ul className="list-disc list-inside">
          <li>Successful payment: 4444 8888 8888 5559</li>
          <li>Failed payment: 4444 8888 8888 4446</li>
          <li>Low funds: 4444 8888 8888 9999</li>
          <li>Lost/stolen card: 4444 8888 8888 1111</li>
        </ul>
      </div>
    </div>
  );
} 