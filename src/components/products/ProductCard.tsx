import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { type Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative aspect-square">
        <Image
          src={product.image || '/placeholder.png'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.discountedPrice && product.discountedPrice < product.price && (
          <div className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
            Akció
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="mb-2 line-clamp-2 text-sm text-gray-600">{product.description}</p>
        
        <div className="mb-2">
          <span className="text-xs text-gray-500">{product.category}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            {product.discountedPrice && product.discountedPrice < product.price ? (
              <>
                <span className="text-lg font-bold text-red-500">
                  {formatPrice(product.discountedPrice)}
                </span>
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {product.stock > 0 ? (
            <span className="text-sm text-green-500">Raktáron</span>
          ) : (
            <span className="text-sm text-red-500">Elfogyott</span>
          )}
        </div>
      </div>
    </Link>
  );
} 
