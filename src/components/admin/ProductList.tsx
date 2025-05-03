'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type Product } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductListProps {
  products: Product[];
  onProductDeleted?: () => void;
}

export const ProductList = ({ products, onProductDeleted }: ProductListProps) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (productId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a terméket?')) {
      return;
    }

    setIsDeleting(productId);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Hiba történt a törlés során');
      }

      toast.success('Termék sikeresen törölve!');
      onProductDeleted?.();
    } catch (error) {
      console.error('Hiba:', error);
      toast.error('Hiba történt a törlés során');
    } finally {
      setIsDeleting(null);
    }
  };

  if (products.length === 0) {
    return <p className="text-gray-500">Nincsenek termékek az adatbázisban.</p>;
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <div key={product.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4">
          <div className="flex items-start gap-4">
            {product.images && product.images.length > 0 ? (
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={true}
                  priority
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-gray-100">
                <span className="text-xs text-gray-500">Nincs kép</span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium">{product.name}</h3>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-500">Kategória: {product.category?.name || 'Nincs kategória'}</p>
                <p className="text-sm text-gray-500">Készlet: {product.stock} db</p>
                <p className="text-sm text-gray-500">Ár: {product.price.toLocaleString()} Ft</p>
                {product.discountedPrice && (
                  <p className="text-sm text-red-500">Akciós ár: {product.discountedPrice.toLocaleString()} Ft</p>
                )}
                <p className="text-xs text-gray-400">Állapot: {product.status}</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Link
              href={`/admin/product-management/edit/${product.id}`}
              className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Szerkesztés
            </Link>
            <button
              className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              onClick={() => handleDelete(product.id)}
              disabled={isDeleting === product.id}
            >
              {isDeleting === product.id ? 'Törlés...' : 'Törlés'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 
