'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

export interface OrderDetailsProps {
  order: {
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
    
    // Rendelési tételek
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
      };
    }>;
    
    // Opcionális felhasználói adatok
    user?: {
      name: string | null;
      email: string | null;
    };
  };
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
  isAdmin?: boolean;
}

const ORDER_STATUSES = {
  PENDING: { label: 'Függőben', color: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'Feldolgozás alatt', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Kiszállítva', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Teljesítve', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Törölve', color: 'bg-red-100 text-red-800' },
};

export default function OrderDetails({ order, onStatusChange, isAdmin = false }: OrderDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
      {/* Rendelés fejléc */}
      <div className="p-4 bg-gray-50 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium">Rendelés: {order.id}</h3>
            <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
              ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.color
            }`}>
              {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {format(new Date(order.createdAt), 'yyyy.MM.dd HH:mm', { locale: hu })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-medium">{formatPrice(order.total)}</span>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            {isOpen ? 'Bezárás' : 'Részletek'}
          </button>
        </div>
      </div>
      
      {/* Rendelés részletek - csak ha nyitva van */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200 divide-y divide-gray-100">
          {/* Felhasználói adatok */}
          {order.user && (
            <div className="py-3">
              <h4 className="text-sm font-medium mb-2">Vásárló adatai</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm"><span className="font-medium">Név:</span> {order.user.name}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {order.user.email}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Szállítási és számlázási címek */}
          <div className="py-3">
            <h4 className="text-sm font-medium mb-2">Szállítási és számlázási adatok</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Szállítási cím */}
              <div>
                <h5 className="text-xs uppercase font-semibold text-gray-500 mb-1">Szállítási cím</h5>
                <p className="text-sm">{order.shippingFullName}</p>
                <p className="text-sm">{order.shippingAddress}</p>
                <p className="text-sm">{order.shippingZipCode} {order.shippingCity}, {order.shippingCountry}</p>
                {order.shippingPhone && <p className="text-sm">Tel: {order.shippingPhone}</p>}
              </div>
              
              {/* Számlázási cím */}
              <div>
                <h5 className="text-xs uppercase font-semibold text-gray-500 mb-1">Számlázási cím</h5>
                <p className="text-sm">{order.billingFullName}</p>
                {order.billingCompanyName && (
                  <p className="text-sm">{order.billingCompanyName} {order.billingTaxNumber && `(${order.billingTaxNumber})`}</p>
                )}
                <p className="text-sm">{order.billingAddress}</p>
                <p className="text-sm">{order.billingZipCode} {order.billingCity}, {order.billingCountry}</p>
                {order.billingPhone && <p className="text-sm">Tel: {order.billingPhone}</p>}
              </div>
            </div>
          </div>
          
          {/* Fizetési és szállítási mód */}
          <div className="py-3">
            <h4 className="text-sm font-medium mb-2">Fizetési és szállítási mód</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p className="text-sm"><span className="font-medium">Fizetési mód:</span> {order.paymentMethod}</p>
              <p className="text-sm"><span className="font-medium">Szállítási mód:</span> {order.shippingMethod}</p>
            </div>
          </div>
          
          {/* Rendelési tételek */}
          <div className="py-3">
            <h4 className="text-sm font-medium mb-2">Rendelt termékek</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Termék</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Mennyiség</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Egységár</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Összesen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm">{item.product.name}</td>
                    <td className="px-4 py-2 text-sm text-right">{item.quantity} db</td>
                    <td className="px-4 py-2 text-sm text-right">{formatPrice(item.price)}</td>
                    <td className="px-4 py-2 text-sm font-medium text-right">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Végösszeg:</td>
                  <td className="px-4 py-2 text-sm font-bold text-right">{formatPrice(order.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Státusz módosítása (csak ha van onStatusChange callback) */}
          {onStatusChange && (
            <div className="py-3">
              <h4 className="text-sm font-medium mb-2">Rendelés kezelése</h4>
              <div className="flex items-center gap-3">
                <label htmlFor="status" className="text-sm">Státusz módosítása:</label>
                <select
                  id="status"
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                  className="text-sm rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  {Object.entries(ORDER_STATUSES).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 