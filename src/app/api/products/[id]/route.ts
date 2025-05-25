import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("API GET /products/[id] started", params.id);
    
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
    
    console.log("Product found:", product?.id || "none");

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
    console.log("API PUT /products/[id] started", params.id);
    
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!params.id) {
      return new NextResponse('Product id is required', { status: 400 })
    }

    const json = await request.json()
    console.log("Received product data:", json);

    const {
      name,
      description,
      descriptionSections,
      price,
      discountedPrice,
      discountLevel1Price,
      discountLevel2Price,
      categoryId,
      stock,
      status,
      sku,
      metaTitle,
      metaDescription,
      images,
      pointValue
    } = json

    if (!name || !description || !price || !categoryId || !stock || !status) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Handle different representations of descriptionSections to ensure it is valid for Prisma
    let processedDescriptionSections;
    
    if (!descriptionSections) {
      processedDescriptionSections = null;
    } else if (typeof descriptionSections === 'string') {
      // If it's already a string, try to parse it to make sure it's valid JSON
      try {
        processedDescriptionSections = JSON.parse(descriptionSections);
      } catch (e) {
        console.error("Error parsing descriptionSections string:", e);
        processedDescriptionSections = null;
      }
    } else {
      // If it's not a string, use it directly
      processedDescriptionSections = descriptionSections;
    }

    console.log("Final processed descriptionSections:", processedDescriptionSections);

    const product = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        descriptionSections: processedDescriptionSections,
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : null,
        discountLevel1Price: discountLevel1Price ? Number(discountLevel1Price) : null,
        discountLevel2Price: discountLevel2Price ? Number(discountLevel2Price) : null,
        categoryId,
        stock: Number(stock),
        status,
        sku: sku || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        images: images || [],
        pointValue: pointValue !== undefined ? Number(pointValue) : 0
      },
    })
    
    console.log("Product updated:", product.id);

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