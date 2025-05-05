import nodemailer from 'nodemailer';
import { formatPrice } from './utils';
import prisma from './prisma';

// A transporter létrehozása kiegészítve hibakezeléssel és TLS beállításokkal
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Ne utasítsa el az érvénytelen tanúsítványokat
    rejectUnauthorized: false
  }
});

// Konfiguráció naplózása (jelszó nélkül)
console.log('Email transporter konfigurálva:', {
  host: process.env.SMTP_HOST, 
  port: process.env.SMTP_PORT, 
  user: process.env.SMTP_USER,
  from: process.env.SMTP_FROM
});

interface OrderEmailParams {
  to: string;
  orderNumber: string;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  orderStatus: string;
}

/**
 * Replaces placeholders in a template with actual values
 */
function replacePlaceholders(text: string, data: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (key === 'total' && typeof value === 'number') {
      return formatPrice(value);
    }
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Sends an order status notification email
 */
export async function sendOrderStatusEmail({
  to,
  orderNumber,
  total,
  shippingMethod,
  paymentMethod,
  orderStatus,
}: OrderEmailParams) {
  try {
    console.log(`Megkísérlem email küldését: státusz = ${orderStatus}, címzett = ${to}, rendelés = ${orderNumber}`);
    
    // Find the email template for the given order status
    const template = await prisma.emailTemplate.findFirst({
      where: {
        triggerStatus: orderStatus as any,
        isActive: true,
      },
    });

    if (!template) {
      console.error(`Nincs aktív email sablon a következő rendelési státuszhoz: ${orderStatus}`);
      return false;
    }

    console.log(`Email sablon megtalálva: ${template.name}`);

    // Replace placeholders in subject and content
    const data = {
      orderNumber,
      total,
      shippingMethod,
      paymentMethod,
    };

    const subject = replacePlaceholders(template.subject, data);
    const html = replacePlaceholders(template.content, data);

    console.log(`Email tartalom elkészítve, küldés a következő címre: ${to}`);

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log(`Email sikeresen elküldve: ${to}, rendelés: ${orderNumber}, státusz: ${orderStatus}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Hiba történt az email küldése során:', error);
    // Ha van további részletes információ, azt is naplózzuk
    if (error instanceof Error) {
      console.error('Hiba üzenet:', error.message);
      console.error('Hiba stack:', error.stack);
    }
    return false;
  }
}

/**
 * Legacy function - kept for backward compatibility
 */
export async function sendOrderConfirmationEmail({
  to,
  orderNumber,
  total,
  shippingMethod,
  paymentMethod,
}: OrderEmailParams) {
  return sendOrderStatusEmail({
    to,
    orderNumber,
    total,
    shippingMethod,
    paymentMethod,
    orderStatus: 'PENDING',
  });
} 
