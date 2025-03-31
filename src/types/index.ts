import { ProductStatus } from '@prisma/client'

export interface Product {
  id?: string
  name: string
  description: string
  price: number
  discountedPrice?: number | null
  images: string[]
  categoryId: string
  stock: number
  createdAt?: string
  updatedAt?: string
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