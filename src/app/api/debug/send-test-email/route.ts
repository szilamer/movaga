import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { sendOrderStatusEmail, getEmailConfigStatus, reinitializeEmailTransporter } from '@/lib/email';

export async function POST(req: Request) {
  try {
    // Require admin permission
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get request data
    const data = await req.json();
    const { email, orderStatus, reinitialize } = data;

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Optional reinitialization of email transporter
    if (reinitialize) {
      const reinitialized = await reinitializeEmailTransporter();
      console.log(`Email transporter reinitialization: ${reinitialized ? 'success' : 'failed'}`);
    }

    // Get current email configuration status
    const configStatus = getEmailConfigStatus();

    // Send test email
    const result = await sendOrderStatusEmail({
      to: email,
      orderNumber: 'TEST-123',
      total: 15000,
      shippingMethod: 'Test Shipping Method',
      paymentMethod: 'Test Payment Method',
      orderStatus: orderStatus || 'PROCESSING',
    });

    return NextResponse.json({
      success: result,
      message: result 
        ? `Test email was sent successfully to ${email}` 
        : `Failed to send test email to ${email}`,
      config: configStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      message: 'Error sending test email',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 