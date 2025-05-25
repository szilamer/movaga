'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { type Product } from '@/types';
import { useDiscount } from '@/hooks/useDiscount';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { getDiscountedPrice } = useDiscount();
  const priceInfo = getDiscountedPrice(
    product.price, 
    product.discountedPrice,
    product.discountLevel1Price,
    product.discountLevel2Price
  );
  
  // Use the first image or a default if no images are available
  const imageUrl = product.images && product.images.length > 0 
    ? getAbsoluteImageUrl(product.images[0])
    : getAbsoluteImageUrl('/hero-bg.jpg');
  
  const categoryName = typeof product.category === 'string' ? product.category : product.category?.name || '';

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative aspect-square">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="mb-2 line-clamp-2 text-sm text-gray-600">{product.description}</p>
        
        <div className="mb-2">
          <span className="text-xs text-gray-500">{categoryName}</span>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div>
            {priceInfo.hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(priceInfo.finalPrice)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(priceInfo.originalPrice)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">
                {formatPrice(priceInfo.finalPrice)}
              </span>
            )}
            
            {(product.discountLevel1Price || product.discountLevel2Price) && (
              <div className="mt-1 space-y-1 text-xs text-gray-600">
                {product.discountLevel1Price && (
                  <div>1. szintű ár: {formatPrice(product.discountLevel1Price)}</div>
                )}
                {product.discountLevel2Price && (
                  <div>2. szintű ár: {formatPrice(product.discountLevel2Price)}</div>
                )}
              </div>
            )}
          </div>
          
          {product.pointValue && product.pointValue > 0 && (
            <div className="text-sm text-gray-600">
              {product.pointValue} pont
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 
