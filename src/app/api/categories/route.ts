import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'

// Slug generáló segédfüggvény
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Hiba a kategóriák lekérdezésekor:', error)
    return NextResponse.json(
      { error: 'Hiba történt a kategóriák betöltésekor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[DEBUG] Session:', session);

    if (!session?.user) {
      console.log('[DEBUG] Nincs bejelentkezve - session hiányzik');
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    // Session alapján ellenőrizzük a jogosultságot közvetlenül
    const userRole = session.user.role as string;
    console.log('[DEBUG] Felhasználó szerepköre session alapján:', userRole);

    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      console.log('[DEBUG] Nem megfelelő jogosultságú felhasználó próbál kategóriát létrehozni:', userRole);
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      )
    }

    const data = await request.json()
    console.log('[DEBUG] Beérkezett kategória adat:', data);
    
    // Validálás - kötelező mezők
    if (!data.name || !data.name.trim()) {
      console.log('[DEBUG] Hiányzó kategórianév');
      return NextResponse.json(
        { error: 'A kategória neve kötelező mező' },
        { status: 400 }
      )
    }
    
    // Ha nincs megadva slug, generáljunk a névből
    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name)
    }
    console.log('[DEBUG] Kategória slug:', data.slug);
    
    // Ellenőrizzük, hogy a slug egyedi-e
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug },
    })
    
    if (existingCategory) {
      console.log('[DEBUG] Már létezik kategória ezzel a slug-gal:', data.slug);
      return NextResponse.json(
        { error: 'Már létezik kategória ezzel az URL-el (slug)' },
        { status: 400 }
      )
    }

    try {
      const category = await prisma.category.create({
        data: {
          name: data.name,
          description: data.description || null,
          slug: data.slug,
        },
      })
      console.log('[DEBUG] Kategória sikeresen létrehozva:', category);
      return NextResponse.json(category)
    } catch (dbError: any) {
      console.error('[DEBUG] Adatbázis hiba a kategória létrehozásakor:', dbError);
      return NextResponse.json(
        { error: `Adatbázis hiba: ${dbError.message || 'Ismeretlen hiba'}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Hiba történt a kategória létrehozása közben:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ismeretlen szerver hiba történt' },
      { status: 500 }
    )
  }
} 
