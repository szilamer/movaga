'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export function CartButton() {
  const [mounted, setMounted] = useState(false);
  const cart = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ne rendereljünk semmit, amíg nem történt meg a hydration
  if (!mounted) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200"></div>
    );
  }

  const itemCount = cart.getItemCount();
  const total = cart.getTotal();

  return (
    <Link
      href="/cart"
      className="group relative flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50"
    >
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-600 transition-colors group-hover:text-blue-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-2 ring-white">
            {itemCount}
          </span>
        )}
      </div>
      <span className="hidden sm:inline">Kosár</span>
      {itemCount > 0 && (
        <span className="hidden font-medium text-blue-600 sm:inline">
          {formatPrice(total)}
        </span>
      )}
      
      {/* Tooltip mobilon */}
      {itemCount > 0 && (
        <div className="absolute -bottom-14 left-1/2 hidden -translate-x-1/2 transform rounded-lg bg-gray-900 px-4 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:hidden">
          {formatPrice(total)}
          <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 transform rotate-45 bg-gray-900"></div>
        </div>
      )}
    </Link>
  );
} 