import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
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
    const isAdminRequest = searchParams.get('admin') === 'true'

    // Ellenőrizzük, hogy admin kérés-e és megfelelő jogosultsággal rendelkezik-e
    let isAdmin = false;
    if (isAdminRequest) {
      const session = await getServerSession(authOptions);
      isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';
    }

    // Build the where clause with proper types
    const where: any = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    
    // Only filter by ACTIVE status if not an admin request
    if (!isAdmin) {
      where.status = 'ACTIVE';
    }

    console.log("API query where:", where);

    // Use 'as any' to avoid TypeScript errors with the query result
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
      }) as any,
      prisma.product.count({ where }),
    ])

    // Process descriptionSections to convert from JSON to proper structure
    const processedProducts = products.map((product: any) => {
      if (product.descriptionSections) {
        try {
          // If descriptionSections is already an object, keep it as is
          if (typeof product.descriptionSections === 'string') {
            product.descriptionSections = JSON.parse(product.descriptionSections);
          }
        } catch (error) {
          console.error(`Error parsing descriptionSections for product ${product.id}:`, error);
          product.descriptionSections = [];
        }
      }
      return product;
    });

    console.log(`API products found: ${processedProducts.length}, total: ${total}`);
    return NextResponse.json({ products: processedProducts, total })
  } catch (error) {
    console.error('Hiba a termékek lekérdezésekor:', error)
    return NextResponse.json(
      { error: 'Hiba történt a termékek betöltésekor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Ellenőrizzük, hogy a felhasználó ADMIN vagy SUPERADMIN-e
  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    console.log("API POST /products started");
    
    const json = await request.json()
    console.log("Received product data for creation:", json);
    
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

    const product = await prisma.product.create({
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
    
    console.log("Product created:", product.id);

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
