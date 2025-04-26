// @ts-nocheck
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      )
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    const total = cartItems.reduce<number>(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    return NextResponse.json({ items: cartItems, total })
  } catch (error) {
    console.error('Hiba történt a kosár lekérése közben:', error)
    return NextResponse.json(
      { error: 'Szerver hiba történt' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      )
    }

    const data = await request.json()

    // Ellenőrizzük a termék elérhetőségét
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'A termék nem található' },
        { status: 404 }
      )
    }

    if (product.stock < data.quantity) {
      return NextResponse.json(
        { error: 'Nincs elegendő készlet' },
        { status: 400 }
      )
    }

    // Ellenőrizzük, hogy van-e már a termék a kosárban
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId: data.productId,
      },
    })

    let cartItem

    if (existingItem) {
      // Ha már van a kosárban, frissítjük a mennyiséget
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    } else {
      // Ha még nincs a kosárban, létrehozunk egy új tételt
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: data.productId,
          quantity: data.quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    }

    return NextResponse.json(cartItem)
  } catch (error) {
    console.error('Hiba történt a kosárba helyezés közben:', error)
    return NextResponse.json(
      { error: 'Szerver hiba történt' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      )
    }

    const data = await request.json()

    // Ellenőrizzük a termék elérhetőségét
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'A termék nem található' },
        { status: 404 }
      )
    }

    if (product.stock < data.quantity) {
      return NextResponse.json(
        { error: 'Nincs elegendő készlet' },
        { status: 400 }
      )
    }

    const cartItem = await prisma.cartItem.update({
      where: {
        id: data.id,
        userId: user.id,
      },
      data: {
        quantity: data.quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(cartItem)
  } catch (error) {
    console.error('Hiba történt a kosár frissítése közben:', error)
    return NextResponse.json(
      { error: 'Szerver hiba történt' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json(
        { error: 'Hiányzó tétel azonosító' },
        { status: 400 }
      )
    }

    await prisma.cartItem.delete({
      where: {
        id: itemId,
        userId: user.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Hiba történt a kosár tétel törlése közben:', error)
    return NextResponse.json(
      { error: 'Szerver hiba történt' },
      { status: 500 }
    )
  }
} 
