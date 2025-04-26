import React from 'react'
import { type Product } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import Link from 'next/link'

interface FeaturedProductsSectionProps {
  products: Product[]
}

export default function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-6 text-black">Kiemelt termékek</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link href="/products" className="px-6 py-3 bg-black text-gold-500 hover:bg-gray-900 rounded-lg">
          Összes termék
        </Link>
      </div>
    </section>
  )
} 
