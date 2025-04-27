'use client';

import Image from 'next/image';
import { useCart, CartItem as CartItemType } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '/hero-bg.jpg';
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <div className="flex items-center space-x-4 py-4">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
        <Image
          src={imageUrl}
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
              {hasDiscount ? (
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">
                    {formatPrice(item.price)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500 line-through">
                    {formatPrice(item.originalPrice!)}
                  </span>
                </div>
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

