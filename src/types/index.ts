import { ProductStatus, Prisma } from '@prisma/client'

export interface DescriptionSection {
  id: string
  title: string
  content: string
}

export interface Product {
  id: string
  name: string
  description: string
  descriptionSections?: DescriptionSection[] | Prisma.JsonValue
  price: number
  discountedPrice?: number | null
  images: string[]
  categoryId: string
  category?: Category
  stock: number
  status: ProductStatus
  sku?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  createdAt?: Date
  updatedAt?: Date
  pointValue?: number
}

export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  parentId?: string
  parent?: Category
  children?: Category[]
  products?: Product[]
  createdAt: Date
  updatedAt: Date
} 
