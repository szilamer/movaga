import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

// GET: Email sablon részleteinek lekérése
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      );
    }

    const { id } = params;

    const template = await (prisma as any).emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Az email sablon nem található' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_GET]', error);
    return NextResponse.json(
      { error: 'Hiba történt az email sablon lekérése során' },
      { status: 500 }
    );
  }
}

// PATCH: Email sablon módosítása
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      );
    }

    const { id } = params;
    const data = await request.json();

    // Ellenőrizzük, hogy létezik-e a sablon
    const template = await (prisma as any).emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Az email sablon nem található' },
        { status: 404 }
      );
    }

    // Ha a triggerStatus változik, ellenőrizzük, hogy nincs-e már ilyen státuszú sablon
    if (data.triggerStatus && data.triggerStatus !== template.triggerStatus) {
      const existingTemplate = await (prisma as any).emailTemplate.findFirst({
        where: {
          triggerStatus: data.triggerStatus,
          id: { not: id },
        },
      });

      if (existingTemplate) {
        return NextResponse.json(
          { error: 'Már létezik sablon ehhez a státuszhoz' },
          { status: 400 }
        );
      }
    }

    // Frissítjük a sablont
    const updatedTemplate = await (prisma as any).emailTemplate.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        subject: data.subject !== undefined ? data.subject : undefined,
        content: data.content !== undefined ? data.content : undefined,
        triggerStatus: data.triggerStatus !== undefined ? data.triggerStatus : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_PATCH]', error);
    return NextResponse.json(
      { error: 'Hiba történt az email sablon módosítása során' },
      { status: 500 }
    );
  }
}

// DELETE: Email sablon törlése
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Ellenőrizzük, hogy létezik-e a sablon
    const template = await (prisma as any).emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Az email sablon nem található' },
        { status: 404 }
      );
    }

    // Töröljük a sablont
    await (prisma as any).emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_DELETE]', error);
    return NextResponse.json(
      { error: 'Hiba történt az email sablon törlése során' },
      { status: 500 }
    );
  }
} 