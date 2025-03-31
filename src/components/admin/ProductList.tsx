'use client';

import { type Product } from '@/types';
import { toast } from 'sonner';

interface ProductListProps {
  products: Product[];
  onProductDeleted?: () => void;
}

export const ProductList = ({ products, onProductDeleted }: ProductListProps) => {
  const handleDelete = async (productId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a terméket?')) {
      return;
    }

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
    }
  };

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <div key={product.id} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="text-lg font-medium">{product.name}</h3>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-500">Kategória: {product.category?.name || 'Nincs kategória'}</p>
              <p className="text-sm text-gray-500">Készlet: {product.stock} db</p>
              <p className="text-sm text-gray-500">Ár: {product.price.toLocaleString()} Ft</p>
              {product.discountedPrice && (
                <p className="text-sm text-red-500">Akciós ár: {product.discountedPrice.toLocaleString()} Ft</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {/* TODO: Implement edit */}}
            >
              Szerkesztés
            </button>
            <button
              className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={() => handleDelete(product.id)}
            >
              Törlés
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 