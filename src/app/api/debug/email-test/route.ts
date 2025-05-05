import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    // Biztonság: csak admin felhasználók férhetnek hozzá
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Nincs jogosultságod ehhez a művelethez' }, { status: 403 });
    }
    
    // Környezeti változók ellenőrzése
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_FROM: process.env.SMTP_FROM,
      // A jelszót biztonsági okokból nem adjuk vissza
      SMTP_PASS_SET: !!process.env.SMTP_PASS
    };
    
    // Teszt email konfigurálása
    const testRecipient = session.user.email;
    
    // Transporter létrehozása
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Ne utasítsa el az érvénytelen tanúsítványokat
        rejectUnauthorized: false
      },
      // Debug mód bekapcsolása
      debug: true
    });
    
    let verificationResult;
    let emailSendResult;
    let verificationError;
    let emailSendError;
    
    // A transporter ellenőrzése
    try {
      verificationResult = await transporter.verify();
    } catch (error) {
      verificationError = error instanceof Error ? error.message : String(error);
    }
    
    // Teszt email küldése
    try {
      if (verificationResult || verificationError === undefined) {
        emailSendResult = await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: testRecipient,
          subject: 'Movaga Email Teszt',
          text: 'Ez egy teszt email a Movaga rendszerből. Ha ezt olvasod, az email küldés működik.',
          html: '<h1>Movaga Email Teszt</h1><p>Ez egy teszt email a Movaga rendszerből. Ha ezt olvasod, az email küldés működik.</p>'
        });
      }
    } catch (error) {
      emailSendError = error instanceof Error ? error.message : String(error);
    }
    
    // Eredmények visszaadása
    return NextResponse.json({
      environment: envVars,
      smtpVerification: {
        success: !!verificationResult,
        error: verificationError 
      },
      emailSend: {
        success: !!emailSendResult,
        messageId: emailSendResult?.messageId,
        recipient: testRecipient,
        error: emailSendError
      },
      info: "A teszt email a bejelentkezett admin email címére lett küldve."
    });
  } catch (error) {
    console.error('Email teszt API hiba:', error);
    return NextResponse.json(
      { error: 'Hiba történt az email teszt során', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 