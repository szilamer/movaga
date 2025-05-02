import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'A kategória nem található' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Hiba a kategória lekérdezésekor:', error)
    return NextResponse.json(
      { error: 'Hiba történt a kategória betöltésekor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[DEBUG][PUT] Session:', session);

    if (!session?.user?.email) {
      console.log('[DEBUG][PUT] Nincs bejelentkezve - session hiányzik vagy nincs email');
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    console.log('[DEBUG][PUT] Talált felhasználó:', user?.email, 'role:', user?.role);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      console.log('[DEBUG][PUT] Nem megfelelő jogosultságú felhasználó próbál kategóriát szerkeszteni:', user?.role);
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      )
    }

    const data = await request.json()
    console.log('[DEBUG][PUT] Beérkezett kategória adat:', data);

    // Ellenőrizzük a slug egyediségét, ha változott
    if (data.slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: params.id }
        }
      })

      if (existingCategory) {
        console.log('[DEBUG][PUT] Már létezik kategória ezzel a slug-gal:', data.slug);
        return NextResponse.json(
          { error: 'Már létezik kategória ezzel az URL-el (slug)' },
          { status: 400 }
        )
      }
    }

    try {
      const category = await prisma.category.update({
        where: { id: params.id },
        data: {
          name: data.name,
          description: data.description,
          slug: data.slug || undefined
        },
      })
      console.log('[DEBUG][PUT] Kategória sikeresen frissítve:', category);
      return NextResponse.json(category)
    } catch (dbError: any) {
      console.error('[DEBUG][PUT] Adatbázis hiba a kategória frissítésekor:', dbError);
      return NextResponse.json(
        { error: `Adatbázis hiba: ${dbError.message || 'Ismeretlen hiba'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Hiba a kategória frissítése közben:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ismeretlen szerver hiba történt' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[DEBUG][DELETE] Session:', session);

    if (!session?.user?.email) {
      console.log('[DEBUG][DELETE] Nincs bejelentkezve - session hiányzik vagy nincs email');
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    console.log('[DEBUG][DELETE] Talált felhasználó:', user?.email, 'role:', user?.role);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      console.log('[DEBUG][DELETE] Nem megfelelő jogosultságú felhasználó próbál kategóriát törölni:', user?.role);
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      )
    }

    // Ellenőrizzük, hogy vannak-e ehhez a kategóriához tartozó termékek
    const productsCount = await prisma.product.count({
      where: { categoryId: params.id },
    })

    if (productsCount > 0) {
      console.log('[DEBUG][DELETE] A kategória nem törölhető, mert termékek vannak hozzárendelve:', params.id, 'Termékek száma:', productsCount);
      return NextResponse.json(
        {
          error: 'A kategória nem törölhető, mert termékek vannak hozzárendelve',
        },
        { status: 400 }
      )
    }

    try {
      await prisma.category.delete({
        where: { id: params.id },
      })
      console.log('[DEBUG][DELETE] Kategória sikeresen törölve:', params.id);
      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.error('[DEBUG][DELETE] Adatbázis hiba a kategória törlésekor:', dbError);
      return NextResponse.json(
        { error: `Adatbázis hiba: ${dbError.message || 'Ismeretlen hiba'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Hiba a kategória törlése közben:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ismeretlen szerver hiba történt' },
      { status: 500 }
    )
  }
} 