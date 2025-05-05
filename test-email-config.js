// This script tests the email configuration
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('Testing SMTP configuration...');
  
  // Log the current SMTP configuration (without password)
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP Port:', process.env.SMTP_PORT);
  console.log('SMTP User:', process.env.SMTP_USER);
  console.log('SMTP From:', process.env.SMTP_FROM);
  
  // Create a test transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
  
  // Try to verify the configuration
  try {
    const verification = await transporter.verify();
    console.log('SMTP Configuration is valid:', verification);
    
    // Send a test email
    console.log('Sending a test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'Test Email from Movaga System',
      text: 'This is a test email to verify the SMTP configuration is working correctly.',
      html: '<p>This is a test email to verify the SMTP configuration is working correctly.</p>',
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error testing SMTP configuration:', error);
  }
}

testEmailConfig().catch(console.error); 