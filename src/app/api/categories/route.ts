import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'

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

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nincs jogosultságod ehhez a művelethez' },
        { status: 403 }
      )
    }

    const data = await request.json()

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Hiba történt a kategória létrehozása közben:', error)
    return NextResponse.json(
      { error: 'Szerver hiba történt' },
      { status: 500 }
    )
  }
} 