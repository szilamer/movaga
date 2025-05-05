import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';
import { sendOrderStatusEmail } from '@/lib/email';
import { OrderStatus } from '@prisma/client';

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

    console.log(`[ADMIN_ORDER_PATCH] Status update request: ${orderId} to ${data.status}`);

    // Ellenőrizzük, hogy létezik-e a rendelés - teljes adatok lekérése
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
    console.log(`[ADMIN_ORDER_PATCH] Status change detected: ${order.status} → ${data.status}, needs notification: ${needsEmailNotification}`);

    // Frissítjük a rendelés státuszát
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: data.status },
    });
    
    // Email notification handling
    let emailResult: { sent: boolean, error: string | null } = { sent: false, error: null };

    // Küldünk email értesítést a státuszváltozásról
    if (needsEmailNotification) {
      try {
        // Get recipient email - we need to check if shippingEmail exists on the order
        let orderEmail = null;
        
        // In the schema, shippingEmail exists directly on the Order model
        if ('shippingEmail' in order && typeof order.shippingEmail === 'string') {
          orderEmail = order.shippingEmail;
        } else if (order.user?.email) {
          orderEmail = order.user.email;
        }
        
        if (orderEmail) {
          console.log(`[ADMIN_ORDER_PATCH] Attempting to send email notification to ${orderEmail} for order ${order.id}`);
          
          const emailSent = await sendOrderStatusEmail({
            to: orderEmail,
            orderNumber: order.id,
            total: order.total,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            orderStatus: data.status,
          });

          if (emailSent) {
            console.log(`[ADMIN_ORDER_PATCH] Email notification successfully sent to ${orderEmail}`);
            emailResult.sent = true;
          } else {
            console.error(`[ADMIN_ORDER_PATCH] Failed to send email notification to ${orderEmail}`);
            emailResult.error = "Email sending failed";
          }
        } else {
          console.error(`[ADMIN_ORDER_PATCH] No email address found for order ${order.id}`);
          emailResult.error = "Missing email address";
        }
      } catch (emailError) {
        console.error(`[ADMIN_ORDER_PATCH] Error sending email notification:`, emailError);
        emailResult.error = emailError instanceof Error ? emailError.message : "Unknown email error";
      }
    }

    return NextResponse.json({
      ...updatedOrder,
      emailNotification: emailResult
    });
  } catch (error) {
    console.error('[ADMIN_ORDER_PATCH]', error);
    return NextResponse.json(
      { error: 'Hiba történt a rendelés módosítása során' },
      { status: 500 }
    );
  }
} 