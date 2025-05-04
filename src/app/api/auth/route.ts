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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hashedPassword: true,
      }
    })

    if (!user || !user.hashedPassword || !user.email) {
      return NextResponse.json(
        { error: 'Hibás bejelentkezési adatok' },
        { status: 401 }
      )
    }

    // Check for admin credentials
    if (json.email === (process.env.ADMIN_EMAIL || 'admin@movaga.hu') && 
        json.password === (process.env.ADMIN_PASSWORD || 'Admin123!')) {
      const token = signJWT({
        userId: 'admin-id',
        email: process.env.ADMIN_EMAIL || 'admin@movaga.hu',
        role: 'SUPERADMIN',
      });
      
      return NextResponse.json({
        token,
        user: {
          id: 'admin-id',
          email: process.env.ADMIN_EMAIL || 'admin@movaga.hu',
          name: process.env.ADMIN_NAME || 'Admin',
          role: 'SUPERADMIN',
        },
      });
    }

    const isValidPassword = await verifyPassword(json.password, user.hashedPassword)
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
        name: user.name || 'User',
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
