import { NextResponse } from 'next/server';
import { BarionService } from '@/lib/barion';
import { prisma } from '@/lib/prisma';
import { Order, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { sendOrderStatusEmail } from '@/lib/email';

// Logolási segédfüggvény
function logToFile(message: string) {
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'barion-callback.log');
  
  try {
    // Ellenőrizzük, hogy létezik-e a logs könyvtár
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Az üzenet hozzáfűzése a logfájlhoz
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Log file write error:', error);
  }
}

export async function POST(request: Request) {
  const logPrefix = `[BARION-CALLBACK][${new Date().toISOString()}]`;
  console.log(`${logPrefix} Callback handler started`);
  logToFile(`Callback handler started`);
  
  try {
    const body = await request.json();
    console.log(`${logPrefix} Callback body:`, JSON.stringify(body, null, 2));
    logToFile(`Callback body: ${JSON.stringify(body, null, 2)}`);
    
    const { PaymentId } = body;

    if (!PaymentId) {
      const errorMsg = 'Missing required parameter: PaymentId';
      console.error(`${logPrefix} ${errorMsg}`);
      logToFile(`ERROR: ${errorMsg}`);
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    // Initialize Barion service with your POS key
    const posKey = process.env.BARION_POS_KEY || '';
    console.log(`${logPrefix} Using POS key:`, posKey);
    logToFile(`Using POS key: ${posKey}`);
    
    const barionService = new BarionService(posKey);

    // Get payment state
    console.log(`${logPrefix} Getting payment state from Barion for PaymentId:`, PaymentId);
    logToFile(`Getting payment state from Barion for PaymentId: ${PaymentId}`);
    
    const paymentState = await barionService.getPaymentState(PaymentId);
    console.log(`${logPrefix} Payment state:`, JSON.stringify(paymentState, null, 2));
    logToFile(`Payment state: ${JSON.stringify(paymentState, null, 2)}`);
    
    // Ellenőrizzük, hogy van-e PaymentRequestId
    if (!paymentState.PaymentRequestId) {
      const errorMsg = `No PaymentRequestId in payment state for PaymentId: ${PaymentId}`;
      console.error(`${logPrefix} ${errorMsg}`);
      logToFile(`ERROR: ${errorMsg}`);
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }
    
    // Find the related order using prisma.$queryRaw with type casting
    console.log(`${logPrefix} Looking for order with barionPaymentId:`, paymentState.PaymentRequestId);
    logToFile(`Looking for order with barionPaymentId: ${paymentState.PaymentRequestId}`);
    
    const orders = await prisma.$queryRaw<Order[]>`
      SELECT * FROM "Order" WHERE "barionPaymentId" = ${paymentState.PaymentRequestId}
    `;
    
    console.log(`${logPrefix} Found ${orders.length} orders`);
    logToFile(`Found ${orders.length} orders`);
    
    const order = orders.length > 0 ? orders[0] : null;
    
    if (!order) {
      const errorMsg = `No order found for payment: ${PaymentId} with request ID: ${paymentState.PaymentRequestId}`;
      console.error(`${logPrefix} ${errorMsg}`);
      logToFile(`ERROR: ${errorMsg}`);
      return NextResponse.json(
        { error: errorMsg },
        { status: 404 }
      );
    }

    console.log(`${logPrefix} Found order: ${order.id} with status: ${order.status}`);
    logToFile(`Found order: ${order.id} with status: ${order.status}`);

    // Handle payment status
    if (paymentState.Status === 'Succeeded') {
      // Payment was successful - update order status to PROCESSING
      console.log(`${logPrefix} Updating order ${order.id} status to PROCESSING`);
      logToFile(`Updating order ${order.id} status to PROCESSING`);
      
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' }
      });
      
      // Ellenőrizzük, hogy valóban frissült-e a státusz
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          user: {
            select: {
              email: true,
            }
          }
        }
      });
      
      console.log(`${logPrefix} Order ${order.id} updated, new status: ${updatedOrder?.status}`);
      logToFile(`Order ${order.id} updated, new status: ${updatedOrder?.status}`);
      
      // Küldünk email értesítést, ha van email cím
      if (updatedOrder?.user?.email) {
        try {
          await sendOrderStatusEmail({
            to: updatedOrder.user.email,
            orderNumber: updatedOrder.id,
            total: updatedOrder.total,
            shippingMethod: updatedOrder.shippingMethod,
            paymentMethod: updatedOrder.paymentMethod,
            orderStatus: 'PROCESSING',
          });
          console.log(`${logPrefix} Payment success email sent to ${updatedOrder.user.email}`);
          logToFile(`Payment success email sent to ${updatedOrder.user.email}`);
        } catch (error) {
          console.error(`${logPrefix} Failed to send payment success email:`, error);
          logToFile(`Failed to send payment success email: ${error}`);
        }
      }
      
      return NextResponse.json({ status: 'success', orderId: order.id });
    }
    else if (paymentState.Status === 'Failed') {
      // Payment failed - order remains in PENDING status
      console.log(`${logPrefix} Payment failed for order ${order.id}`);
      logToFile(`Payment failed for order ${order.id}`);
      return NextResponse.json({ status: 'failed', orderId: order.id });
    }
    else if (paymentState.Status === 'Canceled') {
      // Payment was canceled - order remains in PENDING status
      console.log(`${logPrefix} Payment canceled for order ${order.id}`);
      logToFile(`Payment canceled for order ${order.id}`);
      return NextResponse.json({ status: 'canceled', orderId: order.id });
    }
    else {
      // Handle other states
      console.log(`${logPrefix} Payment status ${paymentState.Status} for order ${order.id}`);
      logToFile(`Payment status ${paymentState.Status} for order ${order.id}`);
      return NextResponse.json({ 
        status: paymentState.Status.toLowerCase(), 
        orderId: order.id 
      });
    }
  } catch (error) {
    console.error(`${logPrefix} Payment callback error:`, error);
    
    // Részletesebb hibaüzenet
    let errorDetails = 'Unknown error';
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
      if (error.stack) {
        errorDetails += `\nStack: ${error.stack}`;
      }
    } else {
      errorDetails = JSON.stringify(error);
    }
    
    logToFile(`ERROR: ${errorDetails}`);
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorDetails },
      { status: 500 }
    );
  } finally {
    console.log(`${logPrefix} Callback handler finished`);
    logToFile(`Callback handler finished`);
  }
} 