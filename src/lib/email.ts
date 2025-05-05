import nodemailer from 'nodemailer';
import { formatPrice } from './utils';
import prisma from './prisma';
import { OrderStatus } from '@prisma/client';
import dns from 'dns';
import net from 'net';

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

// Helper function to test connection to SMTP server
async function testSmtpConnection(host: string, port: number): Promise<{ success: boolean, message: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000; // 5 seconds timeout
    
    // Handle timeout
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ success: false, message: `Connection timed out after ${timeout}ms` });
    }, timeout);
    
    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ success: true, message: `Successfully connected to ${host}:${port}` });
    });
    
    socket.on('error', (err) => {
      clearTimeout(timer);
      resolve({ success: false, message: `Connection error: ${err.message}` });
    });
  });
}

// Initialize email transporter with diagnostics
async function initializeTransporter(): Promise<void> {
  if (!hasValidEmailConfig()) {
    console.warn('Email service disabled due to missing configuration');
    return;
  }

  try {
    const host = process.env.SMTP_HOST || '';
    const port = Number(process.env.SMTP_PORT || 465);
    
    // Verify DNS resolution
    try {
      const addresses = await new Promise<string[]>((resolve, reject) => {
        dns.resolve(host, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      console.log(`SMTP host ${host} resolves to:`, addresses);
    } catch (dnsErr) {
      console.error(`Failed to resolve SMTP host ${host}:`, dnsErr);
    }
    
    // Test raw socket connection
    const connectionTest = await testSmtpConnection(host, port);
    console.log(`SMTP connection test: ${connectionTest.message}`);
    
    if (!connectionTest.success) {
      console.error('SMTP connection test failed. Email service may not work.');
    }
    
    // Create transporter anyway for potential future success
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Do not reject invalid certificates
        rejectUnauthorized: false
      },
      // Add debug option in development
      ...(process.env.NODE_ENV !== 'production' ? { debug: true } : {})
    });
    
    // Log configuration (without password)
    console.log('Email transporter configured:', {
      host, 
      port, 
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM || process.env.SMTP_USER
    });
    
    // Test verification in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        const verified = await transporter.verify();
        console.log('SMTP Verification:', verified ? 'Success' : 'Failed');
      } catch (verifyErr) {
        console.error('SMTP Verification failed:', verifyErr);
      }
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    transporter = null;
  }
}

// Initialize transporter on module load
initializeTransporter().catch(err => {
  console.error('Failed to initialize email transporter:', err);
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
 * Reinitializes the SMTP transporter
 * Can be called if connection was lost or before critical sends
 */
export async function reinitializeEmailTransporter(): Promise<boolean> {
  try {
    await initializeTransporter();
    return !!transporter;
  } catch (error) {
    console.error('Failed to reinitialize email transporter:', error);
    return false;
  }
}

/**
 * Gets the current email configuration status
 */
export function getEmailConfigStatus() {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  
  return {
    configured: hasValidEmailConfig(),
    transporterInitialized: !!transporter,
    configuration: requiredVars.reduce((acc, varName) => {
      acc[varName] = {
        exists: !!process.env[varName],
        value: varName === 'SMTP_PASS' 
          ? (process.env[varName] ? '********' : undefined)
          : process.env[varName]
      };
      return acc;
    }, {} as Record<string, { exists: boolean, value?: string }>),
    environment: process.env.NODE_ENV || 'unknown'
  };
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
    console.log(`[EMAIL] Attempting to send email: status = ${orderStatus}, recipient = ${to}, order = ${orderNumber}`);
    
    // Check if the email service is available
    if (!transporter) {
      console.error('[EMAIL] Email service is not available - check SMTP configuration');
      
      // Try to reinitialize once
      const reinitialized = await reinitializeEmailTransporter();
      if (!reinitialized || !transporter) {
        console.error('[EMAIL] Failed to reinitialize email transporter');
        return false;
      }
      console.log('[EMAIL] Successfully reinitialized email transporter');
    }

    // Validate recipient email
    if (!to || !to.includes('@')) {
      console.error(`[EMAIL] Invalid recipient email address: ${to}`);
      return false;
    }
    
    let subject = '';
    let html = '';
    
    try {
      // Try to find the email template for the given order status using raw query
      // This avoids TypeScript model naming issues
      console.log(`[EMAIL] Looking for template with status: ${orderStatus}`);
      const templates = await prisma.$queryRaw`
        SELECT * FROM "EmailTemplate" 
        WHERE "triggerStatus" = ${orderStatus}::text::"OrderStatus" 
        AND "isActive" = true 
        LIMIT 1
      `;
      
      const template = Array.isArray(templates) && templates.length > 0 ? templates[0] : null;

      if (template) {
        console.log(`[EMAIL] Email template found in database: ${template.name}`);
        subject = template.subject;
        html = template.content;
      } else {
        console.log(`[EMAIL] No active email template found for order status: ${orderStatus}, using fallback`);
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
      console.error('[EMAIL] Error retrieving email template:', dbError);
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

    console.log(`[EMAIL] Email content prepared, sending to: ${to}`);

    // Send email with multiple retries
    let success = false;
    let lastError = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`[EMAIL] Retry attempt ${attempt} of ${maxRetries}`);
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reinitialize transporter on retry
        if (attempt === 1) {
          console.log('[EMAIL] Reinitializing transporter before retry');
          await reinitializeEmailTransporter();
        }
      }
      
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || 'info@movaga.hu',
          to,
          subject,
          html,
        });

        console.log(`[EMAIL] Email successfully sent: to=${to}, order=${orderNumber}, status=${orderStatus}, messageId=${info.messageId}`);
        success = true;
        break;
      } catch (sendError) {
        lastError = sendError;
        
        // Special handling for common SMTP errors
        if (typeof sendError === 'object' && sendError !== null) {
          const error = sendError as any;
          
          // Connection refused errors
          if (error.code === 'ESOCKET' || error.code === 'ECONNREFUSED') {
            console.error(`[EMAIL] Connection to SMTP server failed: ${error.message}`);
            
            // Test raw connection on error to diagnose
            try {
              const host = process.env.SMTP_HOST!;
              const port = Number(process.env.SMTP_PORT!);
              const connectionTest = await testSmtpConnection(host, port);
              console.log(`[EMAIL] SMTP connection diagnostic: ${connectionTest.message}`);
            } catch (diagErr) {
              console.error('[EMAIL] Connection diagnostic failed:', diagErr);
            }
          }
          
          // Authentication errors
          else if (error.code === 'EAUTH') {
            console.error('[EMAIL] SMTP authentication failed. Check credentials.');
          }
          
          // Relay access denied (common with test emails)
          else if (error.code === 'EENVELOPE' && 
                  'rejected' in error && 
                  Array.isArray(error.rejected) && 
                  error.rejected.includes(to)) {
            console.warn(`[EMAIL] Email rejected by server (likely relay access denied) for recipient: ${to}`);
            console.warn('[EMAIL] This is often a configuration issue with the SMTP server.');
            console.warn('[EMAIL] Your SMTP server may need to be configured to allow relaying to external domains.');
            console.warn('[EMAIL] Contact your email provider or consider using a transactional email service like SendGrid, Mailgun, or Amazon SES.');
            
            if (error.response && error.response.includes('Relay access denied')) {
              console.error('[EMAIL] CONFIRMED RELAY ACCESS DENIED ERROR: The SMTP server is not configured to send to external domains.');
              console.error('[EMAIL] In production, contact your email provider to allow relay access for your server IP.');
            }
            
            // This is usually a permanent error, no point retrying
            break;
          }
        }
        
        // Log detailed error
        console.error('[EMAIL] Error sending email via SMTP:', sendError);
        if (sendError instanceof Error) {
          console.error('[EMAIL] Error details:', {
            message: sendError.message,
            name: sendError.name,
            stack: sendError.stack,
          });
        }
      }
    }
    
    if (!success && lastError) {
      console.error('[EMAIL] All retry attempts failed for sending email to:', to);
    }
    
    return success;
  } catch (error) {
    console.error('[EMAIL] Unexpected error in email sending function:', error);
    // Log additional error details if available
    if (error instanceof Error) {
      console.error('[EMAIL] Error message:', error.message);
      console.error('[EMAIL] Error stack:', error.stack);
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
