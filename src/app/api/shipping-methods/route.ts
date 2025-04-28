import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const shippingMethods = await prisma.shippingMethod.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(shippingMethods);
  } catch (error) {
    console.error('[SHIPPING_METHODS_GET]', error);
    return NextResponse.json(
      { error: 'Hiba történt a szállítási módok betöltése során' },
      { status: 500 }
    );
  }
} 