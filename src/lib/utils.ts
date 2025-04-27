import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
 * @param userDiscountPercent - Felhasználó kedvezményszintje (százalékban)
 * @returns Objektum az eredeti, discount és végső árral, valamint hogy van-e kedvezmény
 */
export function calculateDiscountedPrice(
  price: number, 
  discountedPrice: number | null | undefined, 
  userDiscountPercent: number
) {
  // Ha van termék akciós ár, azt vesszük alapul
  const basePrice = discountedPrice && discountedPrice < price ? discountedPrice : price;
  
  // A felhasználói kedvezmény százalékos értéke (pl. 25% = 0.25)
  const userDiscountMultiplier = userDiscountPercent / 100;
  
  // A felhasználói kedvezménnyel számolt ár
  const userDiscountedPrice = Math.round(basePrice * (1 - userDiscountMultiplier));
  
  return {
    originalPrice: price,
    // Ha a termék akciós, akkor az akciós ár, egyébként null
    productDiscountedPrice: discountedPrice && discountedPrice < price ? discountedPrice : null,
    // A végső ár, amil a felhasználói kedvezmény is figyelembe van véve
    finalPrice: userDiscountedPrice,
    // Van-e bármilyen kedvezmény
    hasDiscount: userDiscountedPrice < price
  };
}
