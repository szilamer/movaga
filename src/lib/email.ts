import nodemailer from 'nodemailer';
import { formatPrice } from './utils';
import prisma from './prisma';
import { OrderStatus } from '@prisma/client';

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

// Default email templates for fallback if database templates don't exist
const defaultTemplates: Record<string, { subject: string, content: string }> = {
  'PENDING': {
    subject: 'Rendelés visszaigazolás - Movaga #{{orderNumber}}',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">Köszönjük a rendelésed!</h2>
        <p>Kedves Vásárlónk!</p>
        <p>Köszönjük a rendelésedet a Movaga webáruházból. A rendelésed feldolgozás alatt áll.</p>
        <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
        <p><strong>Végösszeg:</strong> {{total}}</p>
        <p><strong>Szállítási mód:</strong> {{shippingMethod}}</p>
        <p><strong>Fizetési mód:</strong> {{paymentMethod}}</p>
        <p>Hamarosan értesítünk a rendelésed állapotának változásáról.</p>
        <p>Üdvözlettel,<br>A Movaga csapata</p>
      </div>
    `,
  },
  'PROCESSING': {
    subject: 'Rendelésed feldolgozás alatt - Movaga #{{orderNumber}}',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">Rendelésed feldolgozás alatt</h2>
        <p>Kedves Vásárlónk!</p>
        <p>Értesítünk, hogy a #{{orderNumber}} számú rendelésed feldolgozása megkezdődött.</p>
        <p>A csapatunk éppen azon dolgozik, hogy a terméke(i)d a lehető leghamarabb becsomagolásra kerüljenek.</p>
        <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
        <p><strong>Végösszeg:</strong> {{total}}</p>
        <p><strong>Szállítási mód:</strong> {{shippingMethod}}</p>
        <p><strong>Fizetési mód:</strong> {{paymentMethod}}</p>
        <p>Amint a rendelésed feladásra kerül, újabb értesítést küldünk.</p>
        <p>Üdvözlettel,<br>A Movaga csapata</p>
      </div>
    `,
  },
  'SHIPPED': {
    subject: 'Rendelésed kiszállítás alatt - Movaga #{{orderNumber}}',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">Rendelésed úton van!</h2>
        <p>Kedves Vásárlónk!</p>
        <p>Örömmel értesítünk, hogy a #{{orderNumber}} számú rendelésed feladásra került és jelenleg úton van hozzád.</p>
        <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
        <p><strong>Végösszeg:</strong> {{total}}</p>
        <p><strong>Szállítási mód:</strong> {{shippingMethod}}</p>
        <p><strong>Fizetési mód:</strong> {{paymentMethod}}</p>
        <p>Hamarosan megérkezik a rendelésed a megadott címre.</p>
        <p>Köszönjük a türelmed!</p>
        <p>Üdvözlettel,<br>A Movaga csapata</p>
      </div>
    `,
  },
  'COMPLETED': {
    subject: 'Rendelésed teljesítve - Movaga #{{orderNumber}}',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">Rendelésed sikeresen teljesítve!</h2>
        <p>Kedves Vásárlónk!</p>
        <p>Értesítünk, hogy a #{{orderNumber}} számú rendelésed sikeresen teljesítve lett.</p>
        <p>Reméljük, hogy elégedett vagy a termékekkel és a szolgáltatásunkkal!</p>
        <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
        <p><strong>Végösszeg:</strong> {{total}}</p>
        <p>Köszönjük, hogy a Movaga webáruházát választottad, és várjuk, hogy újra vásárolj nálunk!</p>
        <p>Üdvözlettel,<br>A Movaga csapata</p>
      </div>
    `,
  },
  'CANCELLED': {
    subject: 'Rendelésed törölve - Movaga #{{orderNumber}}',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">Rendelésed törölve lett</h2>
        <p>Kedves Vásárlónk!</p>
        <p>Értesítünk, hogy a #{{orderNumber}} számú rendelésed törölve lett.</p>
        <p>Ha nem te kérted a törlést, vagy bármilyen kérdésed van ezzel kapcsolatban, kérjük, vedd fel velünk a kapcsolatot az info@movaga.hu email címen.</p>
        <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
        <p><strong>Végösszeg:</strong> {{total}}</p>
        <p>Üdvözlettel,<br>A Movaga csapata</p>
      </div>
    `,
  },
};

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
    
    let subject = '';
    let html = '';
    
    try {
      // Try to find the email template for the given order status
      const template = await prisma.emailTemplate.findFirst({
        where: {
          triggerStatus: orderStatus as OrderStatus,
          isActive: true,
        },
      });

      if (template) {
        console.log(`Email sablon megtalálva az adatbázisban: ${template.name}`);
        subject = template.subject;
        html = template.content;
      } else {
        console.log(`Nincs aktív email sablon a következő rendelési státuszhoz az adatbázisban: ${orderStatus}, fallback használata`);
        // Fall back to default templates
        const defaultTemplate = defaultTemplates[orderStatus];
        if (defaultTemplate) {
          subject = defaultTemplate.subject;
          html = defaultTemplate.content;
        } else {
          // If no template found for the status, use a generic one
          subject = `Rendelés állapotának frissítése - Movaga #${orderNumber}`;
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h2 style="color: #333;">Rendelés állapotának frissítése</h2>
              <p>Kedves Vásárlónk!</p>
              <p>Értesítünk, hogy a #${orderNumber} számú rendelés állapota megváltozott: ${orderStatus}</p>
              <p>Végösszeg: ${formatPrice(total)}</p>
              <p>Üdvözlettel,<br>A Movaga csapata</p>
            </div>
          `;
        }
      }
    } catch (dbError) {
      console.error('Hiba történt a sablon lekérése során:', dbError);
      // Use fallback templates if database query fails
      const defaultTemplate = defaultTemplates[orderStatus];
      if (defaultTemplate) {
        subject = defaultTemplate.subject;
        html = defaultTemplate.content;
      } else {
        // If no template found for the status, use a generic one
        subject = `Rendelés állapotának frissítése - Movaga #${orderNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #333;">Rendelés állapotának frissítése</h2>
            <p>Kedves Vásárlónk!</p>
            <p>Értesítünk, hogy a #${orderNumber} számú rendelés állapota megváltozott: ${orderStatus}</p>
            <p>Végösszeg: ${formatPrice(total)}</p>
            <p>Üdvözlettel,<br>A Movaga csapata</p>
          </div>
        `;
      }
    }

    // Replace placeholders in subject and content
    const data = {
      orderNumber,
      total,
      shippingMethod,
      paymentMethod,
    };

    subject = replacePlaceholders(subject, data);
    html = replacePlaceholders(html, data);

    console.log(`Email tartalom elkészítve, küldés a következő címre: ${to}`);

    // Check if email configuration exists
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Hiányzó SMTP konfiguráció:', { 
        host: process.env.SMTP_HOST, 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS ? 'beállítva' : 'hiányzik' 
      });
      return false;
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'info@movaga.hu',
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
