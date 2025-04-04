import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { type Product } from '@/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const where = {
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      status: 'ACTIVE',
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }) as Promise<Product[]>,
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ products, total })
  } catch (error) {
    console.error('Hiba a termékek lekérdezésekor:', error)
    return NextResponse.json(
      { error: 'Hiba történt a termékek betöltésekor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Ellenőrizzük, hogy a felhasználó ADMIN-e
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const json = await request.json()
    const {
      name,
      description,
      price,
      discountedPrice,
      categoryId,
      stock,
      status,
      sku,
      metaTitle,
      metaDescription,
      images
    } = json

    // Validáljuk a kötelező mezőket
    if (!name || !description || !price || !categoryId || stock === undefined) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : null,
        categoryId,
        stock: Number(stock),
        status,
        sku: sku || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        images: images || [],
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 