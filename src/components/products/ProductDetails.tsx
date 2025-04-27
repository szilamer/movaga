'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AddToCartButton } from './AddToCartButton';
import { formatPrice } from '@/lib/utils';
import { type Product } from '@/types';
import { useDiscount } from '@/hooks/useDiscount';
import { ProductAccordion } from '@/components/ProductAccordion';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { getDiscountedPrice } = useDiscount();
  const priceInfo = getDiscountedPrice(product.price, product.discountedPrice);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Ensure we have an array of images or provide a default
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/hero-bg.jpg'];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={images[selectedImageIndex]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          
          {/* Thumbnail gallery */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-20 w-20 overflow-hidden rounded border-2 ${
                    selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - kép ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{product.name}</h1>
          
          <div className="mb-4">
            <span className="text-sm text-gray-500">
              {typeof product.category === 'string' ? product.category : product.category?.name || 'Kategória nélkül'}
            </span>
          </div>
          
          <div className="mb-6">
            {priceInfo.hasDiscount ? (
              <div className="flex items-center">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(priceInfo.finalPrice)}
                </span>
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {formatPrice(priceInfo.originalPrice)}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-primary">
                {formatPrice(priceInfo.finalPrice)}
              </span>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">Termék leírása</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          {product.descriptionSections && product.descriptionSections.length > 0 && (
            <ProductAccordion sections={product.descriptionSections} />
          )}
          
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">Raktárkészlet</h2>
            {product.stock > 0 ? (
              <p className="text-green-500">Raktáron - {product.stock} db elérhető</p>
            ) : (
              <p className="text-red-500">Elfogyott</p>
            )}
          </div>
          
          {product.stock > 0 && (
            <AddToCartButton product={product} />
          )}
        </div>
      </div>
    </div>
  );
} 