import nodemailer from 'nodemailer';
import { formatPrice } from './utils';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface OrderConfirmationEmailParams {
  to: string;
  orderNumber: string;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
}

export async function sendOrderConfirmationEmail({
  to,
  orderNumber,
  total,
  shippingMethod,
  paymentMethod,
}: OrderConfirmationEmailParams) {
  const html = `
    <h1>Köszönjük a rendelésed!</h1>
    <p>A rendelésed sikeresen feldolgoztuk.</p>
    
    <h2>Rendelés részletei:</h2>
    <p>Rendelés azonosító: ${orderNumber}</p>
    <p>Végösszeg: ${formatPrice(total)}</p>
    <p>Szállítási mód: ${shippingMethod}</p>
    <p>Fizetési mód: ${paymentMethod}</p>
    
    <p>Hamarosan felvesszük veled a kapcsolatot a szállítás részleteivel kapcsolatban.</p>
    
    <p>Üdvözlettel,<br>MOVAGA csapata</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Rendelés visszaigazolás - ${orderNumber}`,
    html,
  });
} 