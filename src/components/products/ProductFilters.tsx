'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type Category } from '@/types';

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category');
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPriceRange = searchParams.get('priceRange') || 'all';

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Kategóriák</h3>
        <div className="space-y-2">
          <button
            onClick={() => router.push('/products')}
            className={`w-full rounded-lg px-4 py-2 text-left text-sm transition-colors ${
              !currentCategory
                ? 'bg-primary/10 text-primary-foreground'
                : 'text-foreground hover:bg-muted/10'
            }`}
          >
            Összes termék
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                router.push(
                  `/products?${createQueryString('category', category.id)}`
                )
              }
              className={`w-full rounded-lg px-4 py-2 text-left text-sm transition-colors ${
                currentCategory === category.id
                  ? 'bg-primary/10 text-primary-foreground'
                  : 'text-foreground hover:bg-muted/10'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Rendezés</h3>
        <select
          value={currentSort}
          onChange={(e) =>
            router.push(`/products?${createQueryString('sort', e.target.value)}`)
          }
          className="w-full rounded-lg bg-background text-foreground border-border px-4 py-2 text-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
        >
          <option value="newest">Legújabb elöl</option>
          <option value="price-asc">Ár szerint növekvő</option>
          <option value="price-desc">Ár szerint csökkenő</option>
          <option value="name-asc">Név szerint A-Z</option>
          <option value="name-desc">Név szerint Z-A</option>
        </select>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Árkategória</h3>
        <select
          value={currentPriceRange}
          onChange={(e) =>
            router.push(
              `/products?${createQueryString('priceRange', e.target.value)}`
            )
          }
          className="w-full rounded-lg bg-background text-foreground border-border px-4 py-2 text-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
        >
          <option value="all">Összes</option>
          <option value="0-5000">0 - 5.000 Ft</option>
          <option value="5000-10000">5.000 - 10.000 Ft</option>
          <option value="10000-20000">10.000 - 20.000 Ft</option>
          <option value="20000-50000">20.000 - 50.000 Ft</option>
          <option value="50000+">50.000 Ft felett</option>
        </select>
      </div>
    </div>
  );
} 
