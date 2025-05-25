import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Kiszámítja a kedvezményes árat a felhasználó kedvezményszintje alapján
 * @param price - Eredeti ár
 * @param discountedPrice - Akciós ár (ha van)
 * @param discountLevel1Price - 1. szintű kedvezményes ár (ha van)
 * @param discountLevel2Price - 2. szintű kedvezményes ár (ha van)
 * @param userDiscountLevel - Felhasználó kedvezményszintje (0, 1, vagy 2)
 * @returns Objektum az eredeti, discount és végső árral, valamint hogy van-e kedvezmény
 */
export function calculateDiscountedPrice(
  price: number, 
  discountedPrice: number | null | undefined,
  discountLevel1Price: number | null | undefined,
  discountLevel2Price: number | null | undefined,
  userDiscountLevel: number
) {
  // Ha van termék akciós ár, azt vesszük alapul
  let basePrice = discountedPrice && discountedPrice < price ? discountedPrice : price;
  
  // A felhasználói kedvezményszint alapján számoljuk a végső árat
  let finalPrice = basePrice;
  
  if (userDiscountLevel === 1 && discountLevel1Price) {
    finalPrice = discountLevel1Price;
  } else if (userDiscountLevel === 2 && discountLevel2Price) {
    finalPrice = discountLevel2Price;
  }
  
  return {
    originalPrice: price,
    // Ha a termék akciós, akkor az akciós ár, egyébként null
    productDiscountedPrice: discountedPrice && discountedPrice < price ? discountedPrice : null,
    // A végső ár, ami a felhasználói kedvezményszint alapján van kiszámolva
    finalPrice: finalPrice,
    // Van-e bármilyen kedvezmény
    hasDiscount: finalPrice < price
  };
}
