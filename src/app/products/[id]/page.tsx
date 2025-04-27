import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { type Product, type DescriptionSection } from '@/types';
import { ProductDetails } from '@/components/products/ProductDetails';

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

  // Parse description sections if they exist
  let descriptionSections: DescriptionSection[] = [];
  if (product.descriptionSections) {
    try {
      descriptionSections = JSON.parse(product.descriptionSections as string) as DescriptionSection[];
    } catch (error) {
      console.error('Error parsing description sections:', error);
    }
  }

  // Konvertáljuk a Prisma Product típust a saját Product típusunkra
  const formattedProduct: Product = {
    id: product.id,
    name: product.name,
    description: product.description,
    descriptionSections,
    price: product.price,
    discountedPrice: product.discountedPrice,
    images: product.images,
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description ?? undefined,
      slug: product.category.slug,
      parentId: product.category.parentId ?? undefined,
      createdAt: product.category.createdAt,
      updatedAt: product.category.updatedAt
    },
    stock: product.stock,
    status: product.status,
    sku: product.sku,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetails product={formattedProduct} />
    </div>
  );
} 