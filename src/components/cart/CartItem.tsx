'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { useCart, type CartItem } from '@/store/cart';

interface CartItemProps {
  item: CartItem;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center space-x-4 py-4">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {item.discountedPrice && item.discountedPrice < item.price ? (
                <>
                  <span className="font-medium text-red-500">
                    {formatPrice(item.discountedPrice)}
                  </span>
                  <span className="ml-2 text-gray-500 line-through">
                    {formatPrice(item.price)}
                  </span>
                </>
              ) : (
                <span className="font-medium">{formatPrice(item.price)}</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
              className="rounded-md bg-background text-foreground border-border py-1 pl-2 pr-8 text-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
            >
              {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                <option key={num} value={num}>
                  {num} db
                </option>
              ))}
            </select>
            <button
              onClick={() => removeItem(item.id)}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Törlés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
