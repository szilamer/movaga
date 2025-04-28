import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'

// GET: Fetch user's shipping and billing addresses
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    // Fetch the user with their addresses
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        shippingAddress: true,
        billingAddress: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      shippingAddress: user.shippingAddress,
      billingAddress: user.billingAddress,
    })
  } catch (error) {
    console.error('[ADDRESSES_GET]', error)
    return NextResponse.json(
      { error: 'Hiba történt a címadatok lekérése során' },
      { status: 500 }
    )
  }
}

// POST: Save user's shipping and billing addresses
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const { shippingAddress, billingAddress } = await request.json()

    // Upsert shipping address (create or update)
    const updatedShippingAddress = await prisma.shippingAddress.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        fullName: shippingAddress.fullName,
        country: shippingAddress.country,
        city: shippingAddress.city,
        address: shippingAddress.address,
        zipCode: shippingAddress.zipCode,
        phone: shippingAddress.phone,
      },
      create: {
        userId: session.user.id,
        fullName: shippingAddress.fullName,
        country: shippingAddress.country,
        city: shippingAddress.city,
        address: shippingAddress.address,
        zipCode: shippingAddress.zipCode,
        phone: shippingAddress.phone,
      },
    })

    // Upsert billing address (create or update)
    const updatedBillingAddress = await prisma.billingAddress.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        fullName: billingAddress.fullName,
        country: billingAddress.country,
        city: billingAddress.city,
        address: billingAddress.address,
        zipCode: billingAddress.zipCode,
        phone: billingAddress.phone,
        companyName: billingAddress.companyName,
        taxNumber: billingAddress.taxNumber,
      },
      create: {
        userId: session.user.id,
        fullName: billingAddress.fullName,
        country: billingAddress.country,
        city: billingAddress.city,
        address: billingAddress.address,
        zipCode: billingAddress.zipCode,
        phone: billingAddress.phone,
        companyName: billingAddress.companyName,
        taxNumber: billingAddress.taxNumber,
      },
    })

    return NextResponse.json({
      shippingAddress: updatedShippingAddress,
      billingAddress: updatedBillingAddress,
    })
  } catch (error) {
    console.error('[ADDRESSES_POST]', error)
    return NextResponse.json(
      { error: 'Hiba történt a címadatok mentése során' },
      { status: 500 }
    )
  }
} 