import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

// GET: Email sablonok lekérése
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      );
    }

    const templates = await (prisma as any).emailTemplate.findMany({
      orderBy: {
        triggerStatus: 'asc',
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('[EMAIL_TEMPLATES_GET]', error);
    return NextResponse.json(
      { error: 'Hiba történt az email sablonok lekérése során' },
      { status: 500 }
    );
  }
}

// POST: Új email sablon létrehozása
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      );
    }

    const data = await request.json();

    if (!data.name || !data.subject || !data.content || !data.triggerStatus) {
      return NextResponse.json(
        { error: 'Hiányzó mezők: név, tárgy, tartalom vagy trigger státusz' },
        { status: 400 }
      );
    }

    // Check if template with same trigger already exists
    const existingTemplate = await (prisma as any).emailTemplate.findFirst({
      where: {
        triggerStatus: data.triggerStatus,
      },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Már létezik sablon ehhez a státuszhoz' },
        { status: 400 }
      );
    }

    const template = await (prisma as any).emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        triggerStatus: data.triggerStatus,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('[EMAIL_TEMPLATES_POST]', error);
    return NextResponse.json(
      { error: 'Hiba történt az email sablon létrehozása során' },
      { status: 500 }
    );
  }
} 