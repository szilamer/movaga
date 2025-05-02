import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { sendOrderStatusEmail } from '@/lib/email'

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
    const data = await req.json()
    const { 
      items, 
      shippingMethodId, 
      paymentMethod, 
      total,
      barionPaymentId,
      // Shipping address fields
      shippingFullName,
      shippingCountry,
      shippingCity,
      shippingAddress,
      shippingZipCode,
      shippingPhone,
      // Billing address fields
      billingFullName,
      billingCountry,
      billingCity,
      billingAddress,
      billingZipCode,
      billingPhone,
      billingCompanyName,
      billingTaxNumber
    } = data

    // Fetch shipping method details
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: {
        id: shippingMethodId,
      },
    })

    if (!shippingMethod) {
      return NextResponse.json(
        { error: 'A kiválasztott szállítási mód nem található' },
        { status: 400 }
      )
    }

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
          userId: session?.user?.id || null, // Vendég vásárlás esetén null
          total,
          shippingMethod: shippingMethod.name,
          paymentMethod,
          status: 'PENDING',
          barionPaymentId,
          // Address fields
          shippingFullName,
          shippingCountry,
          shippingCity,
          shippingAddress,
          shippingZipCode,
          shippingPhone,
          billingFullName,
          billingCountry,
          billingCity,
          billingAddress,
          billingZipCode,
          billingPhone,
          billingCompanyName,
          billingTaxNumber,
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

    // Email küldése a felhasználónak
    const userEmail = session?.user?.email || data.shippingEmail;
    if (userEmail) {
      try {
        await sendOrderStatusEmail({
          to: userEmail,
          orderNumber: order.id,
          total: order.total,
          shippingMethod: order.shippingMethod,
          paymentMethod: order.paymentMethod,
          orderStatus: 'PENDING',
        });
        console.log(`Order confirmation email sent to ${userEmail} for order ${order.id}`);
      } catch (error) {
        console.error('Failed to send order confirmation email:', error);
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Rendelés hiba:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hiba történt a rendelés feldolgozása során' },
      { status: 500 }
    )
  }
} 
