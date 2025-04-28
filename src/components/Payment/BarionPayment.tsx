import React, { useState } from 'react';
import { BarionService, BarionPaymentRequest, BarionItem, BarionAddress } from '@/lib/barion';

interface BarionPaymentProps {
  posKey: string;
  amount: number;
  currency: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: Error) => void;
}

export const BarionPayment: React.FC<BarionPaymentProps> = ({
  posKey,
  amount,
  currency,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const barionService = new BarionService(posKey);

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      const paymentRequest: BarionPaymentRequest = {
        POSKey: posKey,
        PaymentType: 'Immediate',
        ReservationPeriod: '00:01:00',
        DelayedCapturePeriod: '00:01:00',
        PaymentWindow: '00:30:00',
        GuestCheckOut: true,
        InitiateRecurrence: false,
        RecurrenceType: '',
        RecurrenceId: '',
        FundingSources: ['All'],
        PaymentRequestId: `PAY-${Date.now()}`,
        PayerHint: '',
        CardHolderNameHint: '',
        Items: [
          {
            Name: 'Payment',
            Description: 'Payment for services',
            Quantity: 1,
            Unit: 'piece',
            UnitPrice: amount,
            ItemTotal: amount,
            SKU: 'PAYMENT',
          },
        ],
        ShippingAddress: {
          Country: 'HU',
          City: '',
          Zip: '',
          Street: '',
          FullName: '',
        },
        BillingAddress: {
          Country: 'HU',
          City: '',
          Zip: '',
          Street: '',
          FullName: '',
        },
        RedirectUrl: `${window.location.origin}/payment/success`,
        CallbackUrl: `${window.location.origin}/api/payment/callback`,
        Currency: currency,
        Transactions: [
          {
            POSTransactionId: `TRANS-${Date.now()}`,
            Payee: 'cm szilamer@gmail.com',
            Total: amount,
            Comment: 'Payment for services',
            Items: [
              {
                Name: 'Payment',
                Description: 'Payment for services',
                Quantity: 1,
                Unit: 'piece',
                UnitPrice: amount,
                ItemTotal: amount,
                SKU: 'PAYMENT',
              },
            ],
          },
        ],
      };

      const paymentUrl = await barionService.startPayment(paymentRequest);
      window.location.href = paymentUrl;
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`px-6 py-2 rounded-md text-white font-medium ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Processing...' : 'Pay with Barion'}
      </button>
    </div>
  );
}; 