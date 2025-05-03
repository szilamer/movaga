import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
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

    // Ellenőrizzük, hogy a termékhez tartoznak-e rendelési tételek
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId: params.id
      }
    })

    // Ha vannak rendelési tételek, ne engedjük törölni a terméket
    if (orderItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'A termék nem törölhető, mert rendelésekhez kapcsolódik',
          message: 'A termék nem törölhető, mert rendelések részét képezi. Megjelölheti inaktívként helyette.'
        }, 
        { status: 400 }
      )
    }

    const product = await prisma.product.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('[PRODUCT_DELETE]', error)
    
    // Ellenőrizzük, hogy foreign key constraint hiba történt-e
    if (error?.code === 'P2003' && error?.meta?.field_name?.includes('OrderItem_productId_fkey')) {
      return NextResponse.json(
        { 
          error: 'A termék nem törölhető, mert rendelésekhez kapcsolódik',
          message: 'A termék nem törölhető, mert rendelések részét képezi. Megjelölheti inaktívként helyette.'
        }, 
        { status: 400 }
      )
    }
    
    return new NextResponse('Internal error', { status: 500 })
  }
} 