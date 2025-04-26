'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCart } from '@/store/cart';
import { type Product } from '@/types';

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice,
      image: product.image,
      category: product.category,
      description: product.description,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
    
    toast.success('Termék a kosárba helyezve!', {
      action: {
        label: 'Ugrás a kosárhoz',
        onClick: () => router.push('/cart'),
      },
    });
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={product.stock <= 0}
      className="w-full rounded-lg bg-primary px-8 py-3 text-center font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {product.stock > 0 ? 'Kosárba' : 'Elfogyott'}
    </button>
  );
} 
