import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }
    
    // Log SMTP configuration
    console.log('SMTP Configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
    });
    
    // Create transporter
    const transporter = nodemailer.createTransport({
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
    
    // Send test email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'info@movaga.hu',
      to: email,
      subject: 'Test Email from Movaga',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">Test Email from Movaga</h2>
          <p>This is a test email from your Movaga e-commerce platform.</p>
          <p>If you're receiving this email, it means your email configuration is working properly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
        </div>
      `,
    });
    
    return NextResponse.json({
      message: "Test email sent successfully",
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
      recipient: email
    });
    
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { 
        error: "Failed to send test email", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 