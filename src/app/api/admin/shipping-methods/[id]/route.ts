import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/prisma';

// GET - Egy szállítási mód lekérdezése
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!shippingMethod) {
      return NextResponse.json(
        { error: 'A szállítási mód nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json(shippingMethod);
  } catch (error) {
    console.error('[SHIPPING_METHOD_GET]', error);
    return NextResponse.json(
      { error: 'Hiba történt a szállítási mód betöltése során' },
      { status: 500 }
    );
  }
}

// PUT - Szállítási mód frissítése
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { name, description, price, isActive } = data;

    // Validáció
    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'A név, leírás és ár megadása kötelező' },
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy létezik-e a szállítási mód
    const existingShippingMethod = await prisma.shippingMethod.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingShippingMethod) {
      return NextResponse.json(
        { error: 'A szállítási mód nem található' },
        { status: 404 }
      );
    }

    // Frissítjük a szállítási módot
    const updatedShippingMethod = await prisma.shippingMethod.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        price: parseFloat(price),
        isActive: isActive !== undefined ? isActive : existingShippingMethod.isActive,
      },
    });

    return NextResponse.json(updatedShippingMethod);
  } catch (error) {
    console.error('[SHIPPING_METHOD_PUT]', error);
    return NextResponse.json(
      { error: 'Hiba történt a szállítási mód frissítése során' },
      { status: 500 }
    );
  }
}

// DELETE - Szállítási mód törlése
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Ellenőrizzük, hogy a felhasználó admin vagy superadmin-e
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Nincs jogosultsága ehhez a művelethez' },
        { status: 403 }
      );
    }

    // Ellenőrizzük, hogy létezik-e a szállítási mód
    const existingShippingMethod = await prisma.shippingMethod.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingShippingMethod) {
      return NextResponse.json(
        { error: 'A szállítási mód nem található' },
        { status: 404 }
      );
    }

    // Töröljük a szállítási módot
    await prisma.shippingMethod.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SHIPPING_METHOD_DELETE]', error);
    return NextResponse.json(
      { error: 'Hiba történt a szállítási mód törlése során' },
      { status: 500 }
    );
  }
} 