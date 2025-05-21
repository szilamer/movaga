'use client';

import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <div className="mb-6">
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
            <h1 className="mb-4 text-2xl font-bold">Köszönjük a rendelését!</h1>
            <p className="mb-8 text-gray-600">
              A rendelés visszaigazolását elküldtük e-mailben.
            </p>
            <Link
              href="/products"
              className="inline-block rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90"
            >
              Vásárlás folytatása
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
