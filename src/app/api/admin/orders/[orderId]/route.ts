import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';
import { sendOrderStatusEmail } from '@/lib/email';

// GET: Egy rendelés részletes adatainak lekérése
export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      );
    }

    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
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
    console.error('[ADMIN_ORDER_GET]', error);
    return NextResponse.json(
      { error: 'Hiba történt a rendelés lekérése során' },
      { status: 500 }
    );
  }
}

// PATCH: Rendelés státuszának módosítása
export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      );
    }

    const { orderId } = params;
    const data = await request.json();

    if (!data.status) {
      return NextResponse.json(
        { error: 'Hiányzó státusz érték' },
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy létezik-e a rendelés
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            email: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'A rendelés nem található' },
        { status: 404 }
      );
    }
    
    // Csak akkor küldjünk emailt, ha a státusz változik
    const needsEmailNotification = order.status !== data.status;

    // Frissítjük a rendelés státuszát
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: data.status },
    });
    
    // Küldünk email értesítést a státuszváltozásról
    if (needsEmailNotification) {
      // Használjuk a rendelés email címét vagy a felhasználó email címét
      const orderEmail = order.shippingEmail || (order.user?.email || null);
      
      if (orderEmail) {
        await sendOrderStatusEmail({
          to: orderEmail,
          orderNumber: order.id,
          total: order.total,
          shippingMethod: order.shippingMethod,
          paymentMethod: order.paymentMethod,
          orderStatus: data.status,
        });
      } else {
        console.error(`Nem sikerült email értesítést küldeni a rendelésről: hiányzó email cím (rendelés azonosító: ${order.id})`);
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('[ADMIN_ORDER_PATCH]', error);
    return NextResponse.json(
      { error: 'Hiba történt a rendelés módosítása során' },
      { status: 500 }
    );
  }
} 