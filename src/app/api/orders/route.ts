import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: { product: true }
}>

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    }
  }
}>

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log('Nincs session:', session)
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('[ORDERS_GET]', error)
    return NextResponse.json(
      { error: 'Hiba történt a rendelések betöltése során' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('Nincs session POST-nál:', session)
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const data = await req.json()
    const { items, shippingMethod, paymentMethod, total } = data

    // Készlet ellenőrzése és foglalása tranzakcióban
    const order = await prisma.$transaction(async (tx) => {
      // Készlet ellenőrzése
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
          select: { stock: true, name: true }
        })

        if (!product) {
          throw new Error(`A termék nem található: ${item.id}`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Nincs elegendő készlet a következő termékből: ${product.name}`)
        }
      }

      // Készlet csökkentése
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // Rendelés létrehozása
      return await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          shippingMethod,
          paymentMethod,
          status: 'PENDING',
          items: {
            create: items.map((item: OrderItem) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      })
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Rendelés hiba:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hiba történt a rendelés feldolgozása során' },
      { status: 500 }
    )
  }
} 