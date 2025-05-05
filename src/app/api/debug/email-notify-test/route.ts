import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { sendOrderStatusEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    // Require admin permission
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get request body
    const { email, orderStatus = 'PROCESSING', orderNumber = 'TEST123', total = 10000 } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    console.log('Debug request for order status email test received:', {
      email,
      orderStatus,
      orderNumber,
      total
    });

    // Log SMTP configuration
    console.log('Current SMTP Configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      pass_configured: !!process.env.SMTP_PASS
    });

    // Try to send the email
    console.log(`Starting test email send to ${email} with status ${orderStatus}`);
    
    const result = await sendOrderStatusEmail({
      to: email,
      orderNumber,
      total,
      shippingMethod: 'GLS kézbesítés',
      paymentMethod: 'Banki átutalás',
      orderStatus
    });

    if (result) {
      console.log('Email test completed successfully');
      return NextResponse.json({
        success: true,
        message: 'Order status email sent successfully',
        recipient: email,
        status: orderStatus,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Email sending failed');
      return NextResponse.json({
        success: false,
        message: 'Failed to send email - check server logs for details',
        error: 'Email sending failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in order status email test endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 