import nodemailer from 'nodemailer';
import { formatPrice } from './utils';
import prisma from './prisma';
import { OrderStatus } from '@prisma/client';

// Check if the required email configuration exists
const hasValidEmailConfig = () => {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required email configuration: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};

// Create transport only if configuration exists
let transporter: nodemailer.Transporter | null = null;

if (hasValidEmailConfig()) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Do not reject invalid certificates
        rejectUnauthorized: false
      }
    });
    
    // Log configuration (without password)
    console.log('Email transporter configured:', {
      host: process.env.SMTP_HOST, 
      port: process.env.SMTP_PORT, 
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM || process.env.SMTP_USER
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    transporter = null;
  }
} else {
  console.warn('Email service disabled due to missing configuration');
}

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
    console.log(`Attempting to send email: status = ${orderStatus}, recipient = ${to}, order = ${orderNumber}`);
    
    // Check if the email service is available
    if (!transporter) {
      console.error('Email service is not available - check SMTP configuration');
      return false;
    }

    // Validate recipient email
    if (!to || !to.includes('@')) {
      console.error(`Invalid recipient email address: ${to}`);
      return false;
    }
    
    let subject = '';
    let html = '';
    
    try {
      // Try to find the email template for the given order status using raw query
      // This avoids TypeScript model naming issues
      const templates = await prisma.$queryRaw`
        SELECT * FROM "EmailTemplate" 
        WHERE "triggerStatus" = ${orderStatus}::text::"OrderStatus" 
        AND "isActive" = true 
        LIMIT 1
      `;
      
      const template = Array.isArray(templates) && templates.length > 0 ? templates[0] : null;

      if (template) {
        console.log(`Email template found in database: ${template.name}`);
        subject = template.subject;
        html = template.content;
      } else {
        console.log(`No active email template found for order status: ${orderStatus}, using fallback`);
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
      console.error('Error retrieving email template:', dbError);
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

    console.log(`Email content prepared, sending to: ${to}`);

    // Send email
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'info@movaga.hu',
        to,
        subject,
        html,
      });

      console.log(`Email successfully sent: to=${to}, order=${orderNumber}, status=${orderStatus}, messageId=${info.messageId}`);
      return true;
    } catch (sendError) {
      console.error('Error sending email via SMTP:', sendError);
      
      // Check for relay access denied error - this often happens with test emails
      if (typeof sendError === 'object' && 
          sendError !== null && 
          'code' in sendError && 
          sendError.code === 'EENVELOPE' && 
          'rejected' in sendError && 
          Array.isArray(sendError.rejected) && 
          sendError.rejected.includes(to)) {
        console.warn(`Email rejected by server (likely relay access denied) for recipient: ${to}`);
      }
      
      // Log more detailed error information
      if (sendError instanceof Error) {
        console.error('Error details:', {
          message: sendError.message,
          name: sendError.name,
          stack: sendError.stack,
        });
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error in email sending function:', error);
    // Log additional error details if available
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
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
