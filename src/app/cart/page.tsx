'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { CartItem } from '@/components/cart/CartItem';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">A kosár üres</h1>
          <p className="mb-8 text-gray-600">
            Még nem adtál hozzá termékeket a kosaradhoz.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90"
          >
            Vásárlás folytatása
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Kosár</h1>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-lg border bg-white">
            <div className="divide-y">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-black">Összegzés</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between border-t pt-4">
                <span className="font-medium text-black">Végösszeg:</span>
                <span className="font-bold text-black">{formatPrice(getTotal())}</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full rounded-lg bg-primary px-8 py-3 font-medium text-black transition-colors hover:bg-primary/90"
                >
                  Tovább a megrendeléshez
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full rounded-lg border border-destructive px-8 py-3 font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Kosár ürítése
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
