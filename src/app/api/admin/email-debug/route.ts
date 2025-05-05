import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { sendOrderStatusEmail } from '@/lib/email';

export async function GET(request: Request) {
  try {
    // Biztonság: csak admin felhasználók férhetnek hozzá
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Nincs jogosultságod ehhez a művelethez' }, { status: 403 });
    }
    
    // Környezeti változók (biztonságos módon)
    const environmentVariables = {
      NODE_ENV: process.env.NODE_ENV,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_FROM: process.env.SMTP_FROM,
      SMTP_PASS_SET: process.env.SMTP_PASS ? 'Beállítva' : 'Nincs beállítva'
    };
    
    // Kiírjuk a console log-ba is, hogy a Render konzolban is látható legyen
    console.log('Email konfigurációs debug:', JSON.stringify(environmentVariables, null, 2));
    
    return NextResponse.json({
      environment: environmentVariables
    });
  } catch (error) {
    console.error('Email debug API hiba:', error);
    return NextResponse.json(
      { error: 'Hiba történt az email konfiguráció ellenőrzése során' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Biztonság: csak admin felhasználók férhetnek hozzá
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Nincs jogosultságod ehhez a művelethez' }, { status: 403 });
    }
    
    // Adatok a kérésből
    const data = await request.json();
    
    // Alapérték, ha nincs megadva semmi
    const email = data.email || session.user.email;
    
    console.log(`Teszt email küldése a következő címre: ${email}`);
    
    // Teszt email küldése a sendOrderStatusEmail funkcióval
    const result = await sendOrderStatusEmail({
      to: email,
      orderNumber: 'TEST-123',
      total: 12500,
      shippingMethod: 'Házhozszállítás',
      paymentMethod: 'Bankkártya',
      orderStatus: 'PENDING'
    });
    
    console.log(`Email küldés eredménye: ${result ? 'Sikeres' : 'Sikertelen'}`);
    
    return NextResponse.json({
      success: result,
      message: result 
        ? `Teszt email sikeresen elküldve a következő címre: ${email}` 
        : `Nem sikerült elküldeni a teszt emailt a következő címre: ${email}`
    });
  } catch (error) {
    console.error('Email teszt API hiba:', error);
    return NextResponse.json(
      { 
        error: 'Hiba történt a teszt email küldése során',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 