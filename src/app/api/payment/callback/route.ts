import { NextResponse } from 'next/server';
import { BarionService } from '@/lib/barion';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { PaymentId, Status } = body;

    if (!PaymentId || !Status) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Initialize Barion service with your POS key
    const barionService = new BarionService(process.env.BARION_POS_KEY || '');

    // Get payment state
    const paymentState = await barionService.getPaymentState(PaymentId);

    // Handle different payment states
    switch (Status) {
      case 'Succeeded':
        // Payment was successful
        // Update your database, send confirmation email, etc.
        return NextResponse.json({ status: 'success' });
      
      case 'Failed':
        // Payment failed
        // Update your database, notify user, etc.
        return NextResponse.json({ status: 'failed' });
      
      case 'Canceled':
        // Payment was canceled
        // Update your database, notify user, etc.
        return NextResponse.json({ status: 'canceled' });
      
      default:
        // Handle other states
        return NextResponse.json({ status: 'unknown' });
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 