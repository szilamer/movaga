import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { sendOrderStatusEmail, getEmailConfigStatus } from '@/lib/email';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    // Require admin permission
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    const email = url.searchParams.get('email');
    const status = url.searchParams.get('status') as OrderStatus | null;
    
    // Validate required parameters
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ 
        error: 'Valid order status is required',
        validStatuses: Object.values(OrderStatus)
      }, { status: 400 });
    }

    // Get the order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get shipping method name
    const shippingMethod = await prisma.shippingMethod.findFirst({
      where: { id: order.shippingMethod }
    });

    // Use provided email or get from order user
    let recipientEmail = email;
    if (!recipientEmail) {
      if (order.user?.email) {
        recipientEmail = order.user.email;
      }
    }
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ 
        error: 'Valid email is required (either as query parameter or in the order user)',
        userEmail: order.user?.email
      }, { status: 400 });
    }

    // Generate order number if not available
    const orderNumber = order.id.substring(0, 8).toUpperCase();

    // Send the email
    console.log(`Sending test ${status} email for order ${orderNumber} to ${recipientEmail}`);
    
    const result = await sendOrderStatusEmail({
      to: recipientEmail,
      orderNumber,
      total: order.total,
      shippingMethod: shippingMethod?.name || order.shippingMethod,
      paymentMethod: order.paymentMethod,
      orderStatus: status,
    });

    return NextResponse.json({
      success: result,
      message: result 
        ? `${status} email sent successfully to ${recipientEmail} for order ${orderNumber}` 
        : `Failed to send ${status} email to ${recipientEmail}`,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        userEmail: order.user?.email
      },
      emailConfiguration: getEmailConfigStatus(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending test order status email:', error);
    return NextResponse.json({
      success: false,
      message: 'Error sending test order status email',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 