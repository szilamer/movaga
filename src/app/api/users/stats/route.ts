import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true }
}>

type NetworkMember = {
  id: string
  name: string | null
  email: string
  orders: { total: number }[]
  createdAt: Date
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    // Felhasználó adatainak lekérése
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        referrals: true,
        orders: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)) // Aktuális hónap első napja
            }
          },
          include: {
            items: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'A felhasználó nem található' },
        { status: 404 }
      )
    }

    // Hálózati tagok lekérése
    const networkMembers = await prisma.user.findMany({
      where: { referrerId: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        orders: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1))
            }
          },
          select: {
            total: true
          }
        }
      }
    }) as NetworkMember[]

    // Havi forgalom számítása
    const monthlySales = user.orders.reduce((total: number, order: OrderWithItems) => total + order.total, 0)

    // Hálózati forgalom számítása
    const networkMembersSales = networkMembers.map((member: NetworkMember) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      monthlySales: member.orders.reduce((total: number, order: { total: number }) => total + order.total, 0),
      joinedAt: member.createdAt
    }))

    const totalNetworkSales = networkMembersSales.reduce((total: number, member: { monthlySales: number }) => total + member.monthlySales, 0)

    // Kedvezmény szint számítása
    let discountLevel = 0
    if (monthlySales >= 100000) {
      discountLevel = 30
    } else if (monthlySales >= 50000) {
      discountLevel = 15
    }

    // Jutalék számítása (6%)
    const commission = totalNetworkSales * 0.06

    // Forgalom történet (dummy adat egyelőre)
    const salesHistory = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        date: date.toISOString(),
        amount: Math.floor(Math.random() * 100000)
      }
    }).reverse()

    // Jutalék történet (dummy adat egyelőre)
    const commissionHistory = Array.from({ length: 5 }, (_, i) => ({
      id: `comm_${i}`,
      amount: Math.floor(Math.random() * 10000),
      type: i % 2 === 0 ? 'personal' : 'network',
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      description: i % 2 === 0 ? 'Személyes forgalom után' : 'Hálózati forgalom után'
    }))

    return NextResponse.json({
      monthlySales,
      networkSize: networkMembers.length,
      discountLevel,
      commission,
      salesHistory,
      networkMembers: networkMembersSales,
      commissionHistory,
      totalNetworkSales,
      totalCommission: commission
    })
  } catch (error) {
    console.error('Hiba történt a dashboard adatok lekérése közben:', error)
    return NextResponse.json(
      { error: 'Hiba történt a dashboard adatok lekérése közben' },
      { status: 500 }
    )
  }
} 
