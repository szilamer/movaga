import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return new NextResponse('Product id is required', { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!params.id) {
      return new NextResponse('Product id is required', { status: 400 })
    }

    const json = await request.json()

    const {
      name,
      description,
      descriptionSections,
      price,
      discountedPrice,
      categoryId,
      stock,
      status,
      sku,
      metaTitle,
      metaDescription,
      images,
    } = json

    if (!name || !description || !price || !categoryId || !stock || !status) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        descriptionSections: descriptionSections ? JSON.stringify(descriptionSections) : null,
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
    console.error('[PRODUCT_PUT]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!params.id) {
      return new NextResponse('Product id is required', { status: 400 })
    }

    const product = await prisma.product.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 