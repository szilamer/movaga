import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    // Jogosultság ellenőrzése
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Nincs jogosultságod ehhez a művelethez" },
        { status: 403 }
      );
    }
    
    const { email, orderStatus, orderNumber, total } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Az email cím megadása kötelező" },
        { status: 400 }
      );
    }
    
    // Konfiguráció naplózása (bizalmas adatok nélkül)
    console.log('SMTP konfiguráció naplózása:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      pass: process.env.SMTP_PASS ? '[CONFIGURED]' : '[MISSING]'
    });
    
    // Email sablon kiválasztása a státusz alapján
    const statusTemplates = {
      'PENDING': {
        subject: `Rendelés visszaigazolás - Movaga #${orderNumber || '12345'}`,
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #333;">Köszönjük a rendelésed!</h2>
            <p>Kedves Vásárlónk!</p>
            <p>Köszönjük a rendelésedet a Movaga webáruházból. A rendelésed feldolgozás alatt áll.</p>
            <p><strong>Rendelés azonosító:</strong> #${orderNumber || '12345'}</p>
            <p><strong>Végösszeg:</strong> ${total || '10000'} Ft</p>
            <p>Hamarosan értesítünk a rendelésed állapotának változásáról.</p>
            <p>Üdvözlettel,<br>A Movaga csapata</p>
          </div>
        `
      },
      'PROCESSING': {
        subject: `Rendelésed feldolgozás alatt - Movaga #${orderNumber || '12345'}`,
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #333;">Rendelésed feldolgozás alatt</h2>
            <p>Kedves Vásárlónk!</p>
            <p>Értesítünk, hogy a #${orderNumber || '12345'} számú rendelésed feldolgozása megkezdődött.</p>
            <p><strong>Rendelés azonosító:</strong> #${orderNumber || '12345'}</p>
            <p><strong>Végösszeg:</strong> ${total || '10000'} Ft</p>
            <p>Üdvözlettel,<br>A Movaga csapata</p>
          </div>
        `
      },
      'DEFAULT': {
        subject: `Rendelés állapot frissítés - Movaga #${orderNumber || '12345'}`,
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #333;">Rendelés állapot frissítés</h2>
            <p>Kedves Vásárlónk!</p>
            <p>Értesítünk, hogy a #${orderNumber || '12345'} számú rendelésed állapota megváltozott: ${orderStatus || 'PROCESSING'}</p>
            <p><strong>Rendelés azonosító:</strong> #${orderNumber || '12345'}</p>
            <p><strong>Végösszeg:</strong> ${total || '10000'} Ft</p>
            <p>Üdvözlettel,<br>A Movaga csapata</p>
          </div>
        `
      }
    };
    
    // A megfelelő sablon kiválasztása vagy alapértelmezett használata
    const template = statusTemplates[orderStatus as keyof typeof statusTemplates] || statusTemplates.DEFAULT;
    
    // Transporter létrehozása
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mx03.rackhost.hu',
        port: Number(process.env.SMTP_PORT || 465),
        secure: true,
        auth: {
          user: process.env.SMTP_USER || 'info@movaga.hu',
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Email küldése
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'info@movaga.hu',
        to: email,
        subject: template.subject,
        html: template.content,
      });
      
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        preview: nodemailer.getTestMessageUrl(info),
        timestamp: new Date().toISOString(),
        template: orderStatus,
        to: email
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          host: process.env.SMTP_HOST || 'mx03.rackhost.hu',
          port: Number(process.env.SMTP_PORT || 465), 
          user: process.env.SMTP_USER || 'info@movaga.hu',
          from: process.env.SMTP_FROM || 'info@movaga.hu',
          hasPassword: !!process.env.SMTP_PASS
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending direct email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 