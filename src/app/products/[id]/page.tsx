import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { type Product } from '@/types';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: {
      id: params.id,
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Konvertáljuk a Prisma Product típust a saját Product típusunkra
  const formattedProduct: Product = {
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
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Képgaléria */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={formattedProduct.image}
              alt={formattedProduct.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(1).map((image, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={image}
                    alt={`${product.name} - ${index + 2}. kép`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Termék információk */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{formattedProduct.name}</h1>
            <p className="mt-2 text-sm text-gray-500">{formattedProduct.category}</p>
          </div>

          <div className="space-y-2">
            {formattedProduct.discountedPrice && formattedProduct.discountedPrice < formattedProduct.price ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-red-500">
                    {formatPrice(formattedProduct.discountedPrice)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(formattedProduct.price)}
                  </span>
                </div>
                <div className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                  Akciós ár
                </div>
              </>
            ) : (
              <span className="text-3xl font-bold">
                {formatPrice(formattedProduct.price)}
              </span>
            )}
          </div>

          <div className="prose prose-sm max-w-none">
            <p>{formattedProduct.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Készlet:</span>
              {formattedProduct.stock > 0 ? (
                <span className="text-green-500">Raktáron</span>
              ) : (
                <span className="text-red-500">Elfogyott</span>
              )}
            </div>

            <AddToCartButton product={formattedProduct} />
          </div>
        </div>
      </div>
    </div>
  );
} 