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
import { getHomepageSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
    return null
  }

  const settings = await getHomepageSettings()

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
    discountLevel1Price: p.discountLevel1Price,
    discountLevel2Price: p.discountLevel2Price,
    images: p.images && p.images.length > 0 ? p.images : ['/hero-bg.jpg'],
    categoryId: p.categoryId,
    category: {
      ...p.category,
      description: p.category.description === null ? undefined : p.category.description,
      parentId: p.category.parentId === null ? undefined : p.category.parentId,
    },
    stock: p.stock,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    pointValue: p.pointValue ?? 0,
  }))

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-between"
      style={{
        backgroundImage: settings.usePageBackgroundColor
          ? 'none'
          : (settings.pageBackgroundImage ? `url(${settings.pageBackgroundImage})` : 'none'),
        backgroundColor: settings.usePageBackgroundColor
          ? settings.pageBackgroundColor
          : '#FFFFFF',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <HeroSection 
        backgroundImage={settings.heroBackgroundImage}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
      />
      <FeaturedProductsSection products={formattedProducts} />
      <BusinessPartnersSection 
        title={settings.businessPartnersTitle}
        content={settings.businessPartnersContent}
        useHtml={settings.useHtmlForBusinessPartners}
      />
      <AboutUsSection 
        title={settings.aboutUsTitle}
        content={settings.aboutUsContent}
        useHtml={settings.useHtmlForAboutUs}
      />
      <FooterSection />
    </main>
  )
} 
