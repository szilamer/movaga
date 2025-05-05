// Test script for email sending
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

// Set up a test transporter
const setupTransporter = () => {
  console.log('Setting up transporter with config:', {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    hasPassword: !!process.env.SMTP_PASS
  });

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
  }).format(price);
};

const replacePlaceholders = (text, data) => {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (key === 'total' && typeof value === 'number') {
      return formatPrice(value);
    }
    return value !== undefined ? String(value) : match;
  });
};

// Default template for fallback
const defaultTemplate = {
  subject: 'Rendelés állapotának frissítése - Movaga #{{orderNumber}}',
  content: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #333;">Rendelés állapotának frissítése</h2>
      <p>Kedves Vásárlónk!</p>
      <p>Értesítünk, hogy a #{{orderNumber}} számú rendelés állapota megváltozott</p>
      <p>Végösszeg: {{total}}</p>
      <p>Üdvözlettel,<br>A Movaga csapata</p>
    </div>
  `
};

async function sendTestEmail() {
  const prisma = new PrismaClient();
  const transporter = setupTransporter();
  
  try {
    // Get recipient email from command line arguments or use a default
    const recipientEmail = process.argv[2] || 'test@example.com';
    const status = process.argv[3] || 'PROCESSING';
    
    console.log(`Sending test email to ${recipientEmail} with status ${status}`);
    
    // Try to get email template directly from database
    let template = null;
    try {
      const templates = await prisma.$queryRaw`
        SELECT * FROM "EmailTemplate" 
        WHERE "triggerStatus" = ${status}::text::"OrderStatus" 
        AND "isActive" = true 
        LIMIT 1
      `;
      
      if (Array.isArray(templates) && templates.length > 0) {
        template = templates[0];
        console.log(`Found template: ${template.name}`);
      } else {
        console.log(`No template found for status ${status}, using default`);
        template = defaultTemplate;
      }
    } catch (err) {
      console.error('Error querying template:', err);
      template = defaultTemplate;
    }
    
    // Replace placeholders
    const data = {
      orderNumber: 'TEST-123',
      total: 10000,
      shippingMethod: 'Test Shipping',
      paymentMethod: 'Test Payment',
    };
    
    const subject = replacePlaceholders(template.subject, data);
    const html = replacePlaceholders(template.content, data);
    
    console.log('Sending email with subject:', subject);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'info@movaga.hu',
      to: recipientEmail,
      subject,
      html,
    });
    
    console.log('Email sent successfully:', info.messageId);
    
  } catch (error) {
    console.error('Error sending email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
sendTestEmail()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err)); 