'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AddToCartButton } from './AddToCartButton';
import { formatPrice } from '@/lib/utils';
import { type Product } from '@/types';
import { useDiscount } from '@/hooks/useDiscount';
import { ProductAccordion } from '@/components/ProductAccordion';
import { getAbsoluteImageUrl, getAbsoluteImageUrls } from '@/utils/imageUtils';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { getDiscountedPrice, loading: discountLoading, userDiscountLevel } = useDiscount();
  const priceInfo = getDiscountedPrice(
    product.price, 
    product.discountedPrice,
    product.discountLevel1Price,
    product.discountLevel2Price
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  console.log('🏷️ ProductDetails render:', {
    productName: product.name,
    discountLoading,
    userDiscountLevel,
    priceInfo
  });
  
  // Ensure we have an array of images or provide a default
  const rawImages = product.images && product.images.length > 0 
    ? product.images 
    : ['/hero-bg.jpg'];
  
  // Convert all images to absolute URLs
  const images = getAbsoluteImageUrls(rawImages);
  
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
          <h1 className="mb-4 text-3xl font-bold text-black bg-white inline-block px-3 py-1 rounded">{product.name}</h1>
          
          <div className="mb-4">
            <span className="text-sm text-gray-500 bg-white inline-block px-2 py-1 rounded">
              {typeof product.category === 'string' ? product.category : product.category?.name || 'Kategória nélkül'}
            </span>
          </div>
          
          <div className="mb-6">
            {/* Ár megjelenítése */}
            <div>
              {priceInfo.hasDiscount ? (
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-primary bg-white inline-block px-2 py-1 rounded">
                    {formatPrice(priceInfo.finalPrice)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 line-through bg-white inline-block px-2 py-1 rounded">
                    {formatPrice(priceInfo.originalPrice)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-primary bg-white inline-block px-2 py-1 rounded">
                  {formatPrice(priceInfo.finalPrice)}
                </span>
              )}
            </div>

            {/* Kedvezményes árak megjelenítése */}
            {(product.discountLevel1Price || product.discountLevel2Price) && (
              <div className="mt-2 space-y-1">
                {product.discountLevel1Price && (
                  <div className="text-sm text-gray-700 bg-white inline-block px-2 py-1 rounded mr-2">
                    1. szintű ár: <span className="font-semibold text-primary">{formatPrice(product.discountLevel1Price)}</span>
                  </div>
                )}
                {product.discountLevel2Price && (
                  <div className="text-sm text-gray-700 bg-white inline-block px-2 py-1 rounded">
                    2. szintű ár: <span className="font-semibold text-primary">{formatPrice(product.discountLevel2Price)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Jutalompontok megjelenítése az ár alatt */}
            {product.pointValue && product.pointValue > 0 && (
              <div className="mt-1">
                <span className="text-sm text-gray-700 bg-white inline-block px-2 py-1 rounded">
                  Jutalékpont: <span className="font-semibold text-primary">{product.pointValue}</span>
                </span>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold text-black bg-white inline-block px-2 py-1 rounded">Termék leírása</h2>
            <p className="text-black bg-white p-3 rounded">{product.description}</p>
          </div>
          
          {Array.isArray(product.descriptionSections) && product.descriptionSections.length > 0 && (
            <ProductAccordion sections={product.descriptionSections} />
          )}
          
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold text-black bg-white inline-block px-2 py-1 rounded">Raktárkészlet</h2>
            {product.stock > 0 ? (
              <p className="text-green-500 bg-white inline-block px-2 py-1 rounded">Raktáron - {product.stock} db elérhető</p>
            ) : (
              <p className="text-red-500 bg-white inline-block px-2 py-1 rounded">Elfogyott</p>
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