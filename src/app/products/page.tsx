import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { type Product } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  // Konvertáljuk a Prisma Product típust a saját Product típusunkra
  const formattedProducts: Product[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    discountedPrice: product.discountedPrice,
    image: product.images[0] || '/placeholder.png',
    category: product.category.name,
    stock: product.stock,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Termékek</h1>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <ProductFilters categories={categories} />
        </div>
        
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formattedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {formattedProducts.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">Nem található termék</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
