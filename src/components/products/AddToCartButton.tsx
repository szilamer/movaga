'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useCart } from '@/store/cart';
import { type Product } from '@/types';
import { useDiscount } from '@/hooks/useDiscount';
import { AuthModal } from '@/components/auth/AuthModal';

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem } = useCart();
  const { getDiscountedPrice } = useDiscount();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const priceInfo = getDiscountedPrice(
    product.price, 
    product.discountedPrice,
    product.discountLevel1Price,
    product.discountLevel2Price
  );

  const handleAddToCart = () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    // Az eredeti termék adatainak másolása, a felhasználói kedvezménnyel számolt árakkal
    const productWithDiscount = {
      ...product,
      price: priceInfo.finalPrice,         // A végső ár (kedvezménnyel)
      originalPrice: priceInfo.originalPrice, // Az eredeti ár (kedvezmény nélkül)
      discountedPrice: priceInfo.hasDiscount ? priceInfo.finalPrice : null,  // Csak ha van kedvezmény
    };

    addItem(productWithDiscount);
    
    toast.success('Termék a kosárba helyezve!', {
      action: {
        label: 'Ugrás a kosárhoz',
        onClick: () => router.push('/cart'),
      },
    });
  };

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={product.stock <= 0}
        className="w-full rounded-lg bg-primary px-8 py-3 text-center font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {product.stock > 0 ? 'Kosárba' : 'Elfogyott'}
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAddToCart}
      />
    </>
  );
} 
