import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      );
    }

    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id, // Csak a saját rendeléseit nézheti meg
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
    });

    if (!order) {
      return NextResponse.json(
        { error: 'A rendelés nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[ORDER_GET]', error);
    return NextResponse.json(
      { error: 'Hiba történt a rendelés betöltése során' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const body = await request.json();

    // Update order with the provided data
    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: body,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('[ORDER_PATCH]', error);
    return NextResponse.json(
      { error: 'Hiba történt a rendelés frissítése során' },
      { status: 500 }
    );
  }
} 