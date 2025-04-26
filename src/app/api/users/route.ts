import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        monthlySales: true,
        discountPercent: true,
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()

    // Validáció
    if (!json.email || !json.password || !json.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email formátum ellenőrzése
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(json.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Email egyediség ellenőrzése
    const existingUser = await prisma.user.findUnique({
      where: { email: json.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Ha van referrer_id, ellenőrizzük, hogy létezik-e
    let referrerId = json.referrerId || null
    if (referrerId) {
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId }
      })
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referrer ID' },
          { status: 400 }
        )
      }
    }
    
    // Jelszó hashelése
    const hashedPassword = await hashPassword(json.password)
    
    const user = await prisma.user.create({
      data: {
        email: json.email,
        hashedPassword: hashedPassword,
        name: json.name,
        role: 'USER',
        referrerId: referrerId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        referrer: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    )
  }
} 
