import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/auth'
import { signJWT } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const user = await prisma.user.findUnique({
      where: {
        email: json.email,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Hibás bejelentkezési adatok' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(json.password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Hibás bejelentkezési adatok' },
        { status: 401 }
      )
    }

    const token = signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Hiba történt a bejelentkezés során:', error)
    return NextResponse.json(
      { error: 'Hiba történt a bejelentkezés során' },
      { status: 500 }
    )
  }
} 