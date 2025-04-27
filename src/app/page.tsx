import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import HeroSection from '@/components/HeroSection'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/products/ProductCard'
import { type Product } from '@/types'
import FeaturedProductsSection from '@/components/FeaturedProductsSection'
import BusinessPartnersSection from '@/components/BusinessPartnersSection'
import AboutUsSection from '@/components/AboutUsSection'
import FooterSection from '@/components/FooterSection'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
    return null
  }

  const productsData = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { category: true },
  })

  const formattedProducts: Product[] = productsData.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    discountedPrice: p.discountedPrice,
    images: p.images && p.images.length > 0 ? p.images : ['/hero-bg.jpg'],
    categoryId: p.categoryId,
    category: p.category,
    stock: p.stock,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))

  return (
    <>
      <HeroSection />
      <FeaturedProductsSection products={formattedProducts} />
      <BusinessPartnersSection />
      <AboutUsSection />
      <FooterSection />
    </>
  )
} 
