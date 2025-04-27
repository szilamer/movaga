import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/prisma';
import { ShippingMethod } from '@prisma/client';

// GET - Szállítási módok lekérdezése
export async function GET() {
  try {
    const shippingMethods = await prisma.shippingMethod.findMany({
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

// POST - Új szállítási mód létrehozása
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Ellenőrizzük, hogy a felhasználó admin vagy superadmin-e
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Nincs jogosultsága ehhez a művelethez' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, description, price } = data;

    // Validáció
    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'A név, leírás és ár megadása kötelező' },
        { status: 400 }
      );
    }

    const shippingMethod = await prisma.shippingMethod.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        isActive: true,
      },
    });

    return NextResponse.json(shippingMethod, { status: 201 });
  } catch (error) {
    console.error('[SHIPPING_METHODS_POST]', error);
    return NextResponse.json(
      { error: 'Hiba történt a szállítási mód létrehozása során' },
      { status: 500 }
    );
  }
} 