'use client';

import { useRouter } from 'next/navigation';

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
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
          <h1 className="mb-4 text-3xl font-bold">Köszönjük a rendelését!</h1>
          <p className="mb-8 text-lg text-gray-600">
            A rendelését sikeresen rögzítettük. Hamarosan felvesszük Önnel a kapcsolatot.
          </p>
        </div>

        <div className="space-x-4">
          <button
            onClick={() => router.push('/products')}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Vásárlás folytatása
          </button>
          <button
            onClick={() => router.push('/profile/orders')}
            className="rounded-lg border border-border px-6 py-3 font-medium text-foreground transition-colors hover:bg-muted/90"
          >
            Rendeléseim megtekintése
          </button>
        </div>
      </div>
    </div>
  );
} 
