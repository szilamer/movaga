import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';
import { sendOrderStatusEmail } from '@/lib/email';
import { OrderStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // Security: only allow admin users
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get request parameters
    const { orderId, email, status } = await req.json();

    if (!orderId && !email) {
      return NextResponse.json(
        { error: 'Either orderId or explicit email is required' },
        { status: 400 }
      );
    }

    let orderData = null;
    let recipientEmail = email;
    
    // If orderId is provided, fetch the order details
    if (orderId) {
      try {
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
            { error: 'Order not found' },
            { status: 404 }
          );
        }
        
        orderData = order;
        
        // Use provided email or fall back to order email or user email
        if (!email) {
          // In the schema, this field exists directly on the Order
          if ('shippingEmail' in order && typeof order.shippingEmail === 'string') {
            recipientEmail = order.shippingEmail;
          } else if (order.user?.email) {
            recipientEmail = order.user.email;
          }
        }
        
      } catch (dbError) {
        console.error('Error fetching order:', dbError);
        return NextResponse.json(
          { 
            error: 'Failed to fetch order', 
            details: dbError instanceof Error ? dbError.message : String(dbError)
          },
          { status: 500 }
        );
      }
    }

    // If we still don't have an email, return an error
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No recipient email address found' },
        { status: 400 }
      );
    }

    // Log SMTP configuration
    console.log('Current SMTP Configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      pass_configured: !!process.env.SMTP_PASS
    });

    // Decide on the order status to use
    const orderStatus = status || (orderData?.status || 'PROCESSING');

    console.log(`Attempting to send test email for status ${orderStatus} to ${recipientEmail}`);

    // Send the email
    const result = await sendOrderStatusEmail({
      to: recipientEmail,
      orderNumber: orderData?.id || 'TEST-123',
      total: orderData?.total || 10000,
      shippingMethod: orderData?.shippingMethod || 'Test Shipping',
      paymentMethod: orderData?.paymentMethod || 'Test Payment',
      orderStatus,
    });

    if (result) {
      console.log('Email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        email: recipientEmail,
        orderStatus,
        order: orderData ? { id: orderData.id } : null
      });
    } else {
      console.error('Email sending failed');
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        email: recipientEmail,
        orderStatus
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in order email test endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 